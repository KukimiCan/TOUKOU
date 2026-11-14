// front 担当のファイル。
// 資料詳細の中身（#68）。端末の高さに収め、縦にスクロールさせない（docs/design.md）。
// - 解説がまだのとき：元の画像を大きく出し、下に「解説と確認問題を作る」。作っている間は段階と経過時間、失敗したら理由とやり直し
// - 解説があるとき：元の画像は見出しの右の小さな画像に畳み、解説をタブ（要約・用語・数式…）で切り替える。
//   下に「確認問題を解く」を置き、次にやることを 1 つに絞る
// - 広い画面（lg 以上）では、左に元の画像、右に解説を並べる
// - 元の画像は押すとモーダルで大きく開き、そこから別のタブでも開ける（スマホで指で拡大するため）
// - 板書を送った直後（autoGenerate）は、開いたらそのまま作り始める
"use client";

import {
  CircleAlert,
  CircleCheck,
  ExternalLink,
  ImageOff,
  ListChecks,
  Maximize2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  type GenerateMaterialResponse,
  generateMaterialResponseSchema,
  type MaterialDetailResponse,
} from "@/contracts/materials";

import { Button, buttonClass } from "./ui/button";
import { ButtonLink } from "./ui/button-link";
import { Modal } from "./ui/modal";
import { Screen } from "./ui/screen";
import { Spinner } from "./ui/spinner";
import { type Explanation, ExplanationView } from "./explanation-view";
import { errorMessage, fetchApi } from "./fetch-api";
import {
  formatCreatedAt,
  formatElapsed,
  MATERIAL_KIND_LABELS,
} from "./material-format";

type Props = {
  detail: MaterialDetailResponse;
  courseName: string;
  autoGenerate: boolean;
};

// AI に解説と確認問題を作ってもらう。AI の返事を待つので、少し時間がかかる
async function generate(materialId: string): Promise<GenerateMaterialResponse> {
  const res = await fetchApi(
    `/api/materials/${encodeURIComponent(materialId)}/generate`,
    { method: "POST" },
  );
  return generateMaterialResponseSchema.parse(await res.json());
}

export function MaterialDetail({ detail, courseName, autoGenerate }: Props) {
  const { material, imageUrl } = detail;
  const [explanation, setExplanation] = useState<Explanation | null>(
    detail.explanation,
  );
  // 送った直後に開いたときは、最初から「作っています」にしておく（下の効果で作り始める）
  const [generating, setGenerating] = useState(
    autoGenerate && !detail.explanation,
  );
  // 作った確認問題の数（この画面で作ったときだけ出す）
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  // 自動で作り始めるのは 1 回だけ（開発時に効果が 2 回動いても、二重に作らない）
  const autoStarted = useRef(false);

  const imageAlt = `${courseName}の${MATERIAL_KIND_LABELS[material.kind]}（元の画像）`;

  // 作る。失敗しても「作っています」のまま止まらないよう、最後に必ず戻す
  function runGenerate() {
    return generate(material.id)
      .then((result) => {
        setExplanation(result.explanation);
        setQuestionCount(result.questionCount);
      })
      .catch((e: unknown) => setError(errorMessage(e)))
      .finally(() => setGenerating(false));
  }

  function handleGenerate() {
    if (generating) return;
    setGenerating(true);
    setError(null);
    void runGenerate();
  }

  useEffect(() => {
    if (!autoGenerate || autoStarted.current) return;
    autoStarted.current = true;
    // 読み込み直したときに、もう一度作り始めないよう URL から外す
    window.history.replaceState(null, "", window.location.pathname);
    if (!detail.explanation) void runGenerate();
    // 開いたときに 1 回だけ動かす
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openImage = () => setImageOpen(true);

  return (
    <Screen
      label={formatCreatedAt(material.createdAt)}
      title={courseName}
      width="max-w-5xl"
      actions={
        explanation && (
          <Thumbnail
            src={imageUrl}
            failed={imageFailed}
            onFail={() => setImageFailed(true)}
            onOpen={openImage}
          />
        )
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-8">
        <ImagePane
          src={imageUrl}
          alt={imageAlt}
          failed={imageFailed}
          onFail={() => setImageFailed(true)}
          onOpen={openImage}
          // 解説があるスマホでは、見出しの右の小さな画像だけにする
          className={explanation ? "hidden lg:flex" : "flex"}
        />

        <section
          aria-label="AI の解説"
          className={`flex min-h-0 flex-col gap-3 ${explanation ? "flex-1" : "shrink-0 lg:justify-center"}`}
        >
          {explanation ? (
            <>
              {questionCount !== null && <Done count={questionCount} />}
              <ExplanationView
                explanation={explanation}
                onOpenImage={openImage}
              />
              <ButtonLink
                href="/questions"
                icon={<ListChecks aria-hidden className="size-4" />}
                className="w-full shrink-0"
              >
                確認問題を解く
              </ButtonLink>
            </>
          ) : generating ? (
            <GenerateProgress />
          ) : error ? (
            <div
              role="alert"
              className="bg-danger/10 flex flex-col gap-3 rounded-sm p-4"
            >
              <div className="text-danger flex gap-2 text-sm">
                <CircleAlert aria-hidden className="mt-1 size-4 shrink-0" />
                <div className="flex flex-col">
                  <p className="font-semibold">解説を作れませんでした</p>
                  <p className="[word-break:auto-phrase]">{error}</p>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleGenerate}
                icon={<RefreshCw aria-hidden className="size-4" />}
                className="w-full"
              >
                もう一度作る
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleGenerate}
              icon={<Sparkles aria-hidden className="size-4" />}
              className="w-full"
            >
              解説と確認問題を作る
            </Button>
          )}
        </section>
      </div>

      <Modal
        open={imageOpen}
        onClose={() => setImageOpen(false)}
        title="元の画像"
        footer={
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("secondary")}
          >
            <ExternalLink aria-hidden className="size-4" />
            別のタブで開く
          </a>
        }
      >
        {imageFailed ? (
          <ImageFailed />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- 画像の URL は API が毎回作る一時 URL なので、普通の <img> を使う
          <img
            src={imageUrl}
            alt={imageAlt}
            className="mx-auto max-h-[65dvh] w-full object-contain"
          />
        )}
      </Modal>
    </Screen>
  );
}

// 元の画像を大きく出す枠。押すとモーダルで開く
function ImagePane({
  src,
  alt,
  failed,
  onFail,
  onOpen,
  className,
}: {
  src: string;
  alt: string;
  failed: boolean;
  onFail: () => void;
  onOpen: () => void;
  className: string;
}) {
  if (failed) {
    return (
      <div
        className={`border-line bg-surface min-h-0 flex-1 flex-col items-center justify-center rounded-sm border p-4 ${className}`}
      >
        <ImageFailed />
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="元の画像を大きく見る"
      className={`group border-line bg-surface hover:border-foreground relative min-h-0 flex-1 overflow-hidden rounded-sm border transition-colors ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- 画像の URL は API が毎回作る一時 URL なので、普通の <img> を使う */}
      <img
        src={src}
        alt={alt}
        onError={onFail}
        className="absolute inset-0 size-full object-contain"
      />
      <span className="border-line bg-surface text-muted group-hover:text-foreground absolute right-2 bottom-2 grid size-8 place-items-center rounded-sm border transition-colors">
        <Maximize2 aria-hidden className="size-4" />
      </span>
    </button>
  );
}

// 見出しの右に置く、元の画像の小さな表示（解説を読んでいるとき）
function Thumbnail({
  src,
  failed,
  onFail,
  onOpen,
}: {
  src: string;
  failed: boolean;
  onFail: () => void;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="元の画像を見る"
      className="border-line bg-surface hover:border-foreground text-muted relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-sm border transition-colors lg:hidden"
    >
      {failed ? (
        <ImageOff aria-hidden className="size-5" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- 画像の URL は API が毎回作る一時 URL なので、普通の <img> を使う
        <img
          src={src}
          alt=""
          onError={onFail}
          className="absolute inset-0 size-full object-cover"
        />
      )}
    </button>
  );
}

// 一時 URL が切れて画像を出せないとき
function ImageFailed() {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <ImageOff aria-hidden className="text-muted size-8" strokeWidth={1.5} />
      <p className="text-muted text-sm [word-break:auto-phrase]">
        画像のリンクが切れました。読み込み直してください
      </p>
      <Button
        type="button"
        variant="secondary"
        onClick={() => window.location.reload()}
        icon={<RefreshCw aria-hidden className="size-4" />}
      >
        読み込み直す
      </Button>
    </div>
  );
}

// 作り終えたときの知らせ。少しだけ目立つ動きで出す
function Done({ count }: { count: number }) {
  return (
    <p
      role="status"
      className="bg-success/10 text-success flex shrink-0 items-center gap-2 rounded-sm px-3 py-2 text-sm font-semibold transition-[opacity,translate] duration-300 starting:translate-y-1 starting:opacity-0"
    >
      <CircleCheck
        aria-hidden
        className="size-4 shrink-0 transition-transform delay-150 duration-300 starting:scale-0"
      />
      {count > 0
        ? `解説と確認問題 ${count} 問ができました`
        : "解説ができました"}
    </p>
  );
}

// 生成中に出す段階。API から実際の進み具合は取れないので、経過時間（秒）で切り替える目安
const STEPS = [
  { label: "板書を読み取っています", short: "読み取り", from: 0 },
  { label: "解説を書いています", short: "解説", from: 12 },
  { label: "確認問題を作っています", short: "確認問題", from: 40 },
];

// これより長くかかったら、待たせていることを一言添える（秒）
const SLOW_AFTER = 90;

// 生成中の表示。出ている間（= 生成中）だけ時間を数える
function GenerateProgress() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 今の段階 = 始まりの時間を過ぎた段階のうち、最後のもの
  const current = STEPS.reduce(
    (last, step, i) => (elapsed >= step.from ? i : last),
    0,
  );

  return (
    <div className="border-line bg-surface flex flex-col gap-3 rounded-sm border p-4">
      <div className="flex items-center justify-between gap-3">
        <p
          role="status"
          className="flex items-center gap-2 font-semibold whitespace-nowrap"
        >
          <span className="text-accent">
            <Spinner />
          </span>
          {STEPS[current].label}
        </p>
        <p className="font-display text-muted text-sm whitespace-nowrap tabular-nums">
          <span className="sr-only">経過時間 </span>
          {formatElapsed(elapsed)}
        </p>
      </div>

      <ol className="grid grid-cols-3 gap-1.5" aria-label="進み具合（目安）">
        {STEPS.map((step, i) => {
          const state = i < current ? "done" : i === current ? "now" : "next";
          return (
            <li
              key={step.short}
              aria-current={state === "now" ? "step" : undefined}
              className={`flex flex-col gap-1.5 text-xs transition-colors ${
                state === "next" ? "text-muted" : "text-foreground"
              }`}
            >
              <span className="bg-line relative h-1 overflow-hidden rounded-sm">
                {state === "done" && (
                  <span className="bg-accent absolute inset-0" />
                )}
                {state === "now" && (
                  <span
                    aria-hidden
                    className="bg-accent absolute inset-0 origin-left"
                    style={{
                      animation: "bar 1600ms ease-out infinite alternate",
                    }}
                  />
                )}
              </span>
              {step.short}
            </li>
          );
        })}
      </ol>

      {elapsed >= SLOW_AFTER && (
        <p className="text-muted text-xs [word-break:auto-phrase]">
          時間がかかっています。この画面のまま、もう少しお待ちください
        </p>
      )}
    </div>
  );
}
