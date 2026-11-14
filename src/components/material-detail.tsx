// front 担当のファイル。
// 資料詳細の中身（#68）。端末の高さに収め、縦にスクロールさせない（docs/design.md）。
// - 解説がまだのとき：元の画像を大きく出し、下に「解説を作る」。押すと裏で作り始め、画面は移らない（終わったら通知で知らせる）
// - 解説があるとき：元の画像は見出しの右の小さな画像に畳み、解説をタブ（要約・用語・数式…）で切り替える。
//   下に「確認問題を解く」を置き、次にやることを 1 つに絞る
// - 広い画面（lg 以上）では、左に元の画像、右に解説を並べる
// - 元の画像は押すとモーダルで大きく開き、そこから別のタブでも開ける（スマホで指で拡大するため）
"use client";

import {
  ExternalLink,
  ImageOff,
  ListChecks,
  Maximize2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import type { MaterialDetailResponse } from "@/contracts/materials";

import { Button, buttonClass } from "./ui/button";
import { ButtonLink } from "./ui/button-link";
import { Modal } from "./ui/modal";
import { Screen } from "./ui/screen";
import { ExplanationView } from "./explanation-view";
import { useGeneration } from "./generation-provider";
import { formatCreatedAt, MATERIAL_KIND_LABELS } from "./material-format";

type Props = {
  detail: MaterialDetailResponse;
  courseName: string;
};

export function MaterialDetail({ detail, courseName }: Props) {
  const { material, imageUrl, explanation } = detail;
  const { generatingIds, startGeneration } = useGeneration();
  const generating = generatingIds.has(material.id);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  const imageAlt = `${courseName}の${MATERIAL_KIND_LABELS[material.kind]}（元の画像）`;

  const openImage = () => setImageOpen(true);

  return (
    <Screen
      label={formatCreatedAt(material.createdAt)}
      labelStyle="ja"
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
          ) : (
            <>
              <Button
                type="button"
                onClick={() => startGeneration(material.id, courseName)}
                loading={generating}
                icon={<Sparkles aria-hidden className="size-4" />}
                className="w-full"
              >
                {generating ? "解説を作成中" : "解説を作る"}
              </Button>
              {generating && (
                <p className="text-muted text-sm [word-break:auto-phrase]">
                  できたら、画面の上に知らせます。ほかの画面に移っても作り続けます
                </p>
              )}
            </>
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
