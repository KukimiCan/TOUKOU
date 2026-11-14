// front 担当のファイル。
// 資料詳細の中身（#68）。上に元の画像、その下に AI の解説を並べる。
// - 元の画像は押すと別のタブで大きく開ける（スマホでは指で拡大できる）。一時 URL が切れて出せないときは、読み込み直しを案内する
// - 解説の前に「AI の解説は間違うことがあります」と出し、元の画像へ戻るリンクも付ける
// - 解説がまだの資料には「解説と確認問題を作る」ボタンを出す。押すと API（POST /api/materials/[id]/generate）で作る（#69）
// - 作っている間（数十秒〜数分）は、段階と経過時間を出す（GenerateProgress）。
//   API から実際の進み具合は取れないので、段階は経過時間で切り替える「目安」であることを画面に書く
// - 失敗したら、理由と「もう一度作る」ボタンを出す
"use client";

import {
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  ExternalLink,
  ImageOff,
  Info,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  type GenerateMaterialResponse,
  generateMaterialResponseSchema,
  type MaterialDetailResponse,
} from "@/contracts/materials";

import { Button } from "./ui/button";
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
};

// AI に解説と確認問題を作ってもらう。AI の返事を待つので、少し時間がかかる
async function generate(materialId: string): Promise<GenerateMaterialResponse> {
  const res = await fetchApi(
    `/api/materials/${encodeURIComponent(materialId)}/generate`,
    { method: "POST" },
  );
  return generateMaterialResponseSchema.parse(await res.json());
}

export function MaterialDetail({ detail, courseName }: Props) {
  const { material, imageUrl } = detail;
  const [explanation, setExplanation] = useState<Explanation | null>(
    detail.explanation,
  );
  const [generating, setGenerating] = useState(false);
  // 作った確認問題の数（作ったときだけ出す）
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  const kindLabel = MATERIAL_KIND_LABELS[material.kind];

  async function handleGenerate() {
    if (generating) return;
    setGenerating(true);
    setError(null);
    // 失敗しても「作っています」のまま止まらないよう、最後に必ず戻す
    try {
      const result = await generate(material.id);
      setExplanation(result.explanation);
      setQuestionCount(result.questionCount);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl [word-break:auto-phrase]">{courseName}</h1>
        <p className="text-muted flex flex-wrap items-center gap-x-2 text-sm">
          <span>{kindLabel}</span>
          <span aria-hidden>・</span>
          <span className="font-display tabular-nums">
            {formatCreatedAt(material.createdAt)}
          </span>
        </p>
      </header>

      <figure id="original" className="flex scroll-mt-20 flex-col gap-1.5">
        {imageFailed ? (
          <div className="border-line bg-surface flex flex-col items-center gap-3 rounded-sm border px-4 py-10 text-center">
            <ImageOff
              aria-hidden
              className="text-muted size-8"
              strokeWidth={1.5}
            />
            <p className="text-muted text-sm [word-break:auto-phrase]">
              元の画像を表示できませんでした。画像のリンクは時間がたつと切れるので、画面を読み込み直してください。
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => window.location.reload()}
              icon={<RefreshCw aria-hidden className="size-4" />}
              className="whitespace-nowrap"
            >
              読み込み直す
            </Button>
          </div>
        ) : (
          <>
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border-line bg-surface hover:border-foreground block overflow-hidden rounded-sm border transition-colors"
            >
              {/* 画像の URL は API が毎回作る一時 URL なので、Next.js の <Image> ではなく普通の <img> を使う */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={`${courseName}の${kindLabel}（元の画像）`}
                onError={() => setImageFailed(true)}
                className="max-h-[50vh] w-full object-contain"
              />
            </a>
            <figcaption className="text-muted flex items-center gap-1.5 text-xs">
              <ExternalLink aria-hidden className="size-3.5 shrink-0" />
              画像を押すと、別のタブで大きく開きます
            </figcaption>
          </>
        )}
      </figure>

      <section
        aria-labelledby="explanation-heading"
        className="flex flex-col gap-5"
      >
        <h2
          id="explanation-heading"
          className="flex items-center gap-2 text-lg"
        >
          <Sparkles aria-hidden className="text-accent size-4" />
          AI の解説
        </h2>

        {explanation ? (
          <div className="flex flex-col gap-5 transition-[opacity,translate] duration-300 starting:translate-y-1 starting:opacity-0">
            {questionCount !== null && (
              <div
                role="status"
                className="bg-success/10 text-success flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm px-3 py-2.5 text-sm"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <CircleCheck aria-hidden className="size-4 shrink-0" />
                  {questionCount > 0
                    ? `解説と、確認問題を ${questionCount} 問作りました`
                    : "解説を作りました"}
                </span>
                {questionCount > 0 && (
                  <Link
                    href="/questions"
                    className="text-foreground ml-auto inline-flex items-center gap-0.5 font-semibold whitespace-nowrap underline-offset-4 hover:underline"
                  >
                    問題を確かめる
                    <ChevronRight aria-hidden className="size-4" />
                  </Link>
                )}
              </div>
            )}
            <p
              role="note"
              className="border-accent bg-accent-soft flex gap-2 border-l-2 px-3 py-2.5 text-sm leading-relaxed"
            >
              <Info aria-hidden className="text-accent mt-1 size-4 shrink-0" />
              <span className="[word-break:auto-phrase]">
                AI の解説は間違うことがあります。
                <a
                  href="#original"
                  className="font-semibold underline underline-offset-4"
                >
                  元の画像
                </a>
                と見比べて確かめてください。
              </span>
            </p>
            <ExplanationView explanation={explanation} />
          </div>
        ) : generating ? (
          <GenerateProgress />
        ) : error ? (
          <div
            role="alert"
            className="bg-danger/10 flex flex-col items-start gap-3 rounded-sm p-4"
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
              variant="secondary"
              onClick={handleGenerate}
              icon={<RefreshCw aria-hidden className="size-4" />}
              className="whitespace-nowrap"
            >
              もう一度作る
            </Button>
          </div>
        ) : (
          <div className="border-line bg-surface flex flex-col gap-4 rounded-sm border p-4">
            <p className="text-sm leading-relaxed [word-break:auto-phrase]">
              この資料の解説はまだありません。AI
              が板書を読み取って、要約・用語・数式の解説と、確認問題を作ります。
            </p>
            <Button
              type="button"
              onClick={handleGenerate}
              icon={<Sparkles aria-hidden className="size-4" />}
              className="w-full whitespace-nowrap"
            >
              解説と確認問題を作る
            </Button>
            <p className="text-muted text-center text-xs">
              数十秒から数分かかります
            </p>
          </div>
        )}
      </section>
    </article>
  );
}

// 生成中に出す段階。API から実際の進み具合は取れないので、経過時間（秒）で切り替える目安
const STEPS = [
  { label: "板書を読み取っています", from: 0 },
  { label: "解説を書いています", from: 12 },
  { label: "確認問題を作っています", from: 40 },
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
    <div className="border-line bg-surface relative flex flex-col gap-4 overflow-hidden rounded-sm border p-4">
      {/* 上端の細い線で、止まっていないことを伝える */}
      <span
        aria-hidden
        className="bg-accent absolute inset-x-0 top-0 h-0.5 origin-left"
        style={{ animation: "bar 1600ms ease-out infinite alternate" }}
      />

      <div className="flex items-baseline justify-between gap-3">
        <p className="font-semibold">解説と確認問題を作っています</p>
        <p className="font-display text-muted text-sm whitespace-nowrap tabular-nums">
          <span className="sr-only">経過時間 </span>
          {formatElapsed(elapsed)}
        </p>
      </div>

      <ol className="flex flex-col gap-2.5">
        {STEPS.map((step, i) => {
          const state = i < current ? "done" : i === current ? "now" : "next";
          return (
            <li
              key={step.label}
              aria-current={state === "now" ? "step" : undefined}
              className={`flex items-center gap-2.5 text-sm transition-colors ${
                state === "next" ? "text-muted" : "text-foreground"
              } ${state === "now" ? "font-semibold" : ""}`}
            >
              <span className="grid size-5 shrink-0 place-items-center">
                {state === "done" ? (
                  <Check aria-hidden className="text-accent size-4" />
                ) : state === "now" ? (
                  <span className="text-accent">
                    <Spinner />
                  </span>
                ) : (
                  <span aria-hidden className="bg-line size-1.5 rounded-full" />
                )}
              </span>
              {step.label}
            </li>
          );
        })}
      </ol>

      {/* 読み上げには、今の段階だけを伝える */}
      <p role="status" className="sr-only">
        {STEPS[current].label}
      </p>

      <p className="text-muted border-line border-t pt-3 text-xs leading-relaxed [word-break:auto-phrase]">
        {elapsed < SLOW_AFTER
          ? "段階は目安です。数十秒から数分かかるので、この画面のままお待ちください。"
          : "いつもより時間がかかっています。もう少しだけ、この画面のままお待ちください。"}
      </p>
    </div>
  );
}
