// front 担当のファイル。
// 資料詳細の中身（#68）。上に元の画像、その下に AI の解説を並べる。
// - 元の画像は押すと別のタブで大きく開ける（スマホでは指で拡大できる）
// - 解説の前に「AI の解説は間違うことがあります」と出し、元の画像へ戻るリンクも付ける
// - 解説がまだの資料には「解説と確認問題を作る」ボタンを出す。いまは仮の動き（少し待って仮データを出す）。
//   API（POST /api/materials/[id]/generate）につなぐのは #69
"use client";

import { useState } from "react";

import type {
  GenerateMaterialResponse,
  MaterialDetailResponse,
} from "@/contracts/materials";
import { mockGenerateMaterialResponse } from "@/mocks/materials";

import { type Explanation, ExplanationView } from "./explanation-view";
import { formatCreatedAt, MATERIAL_KIND_LABELS } from "./material-format";

type Props = {
  detail: MaterialDetailResponse;
  courseName: string;
};

// 【仮の動き。#69 で API に置き換える】AI が作るのを待つ代わりに、少し待って仮データを返す
async function generate(): Promise<GenerateMaterialResponse> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return mockGenerateMaterialResponse;
}

export function MaterialDetail({ detail, courseName }: Props) {
  const { material, imageUrl } = detail;
  const [explanation, setExplanation] = useState<Explanation | null>(
    detail.explanation,
  );
  const [generating, setGenerating] = useState(false);
  // 作った確認問題の数（作ったときだけ出す）
  const [questionCount, setQuestionCount] = useState<number | null>(null);

  async function handleGenerate() {
    if (generating) return;
    setGenerating(true);
    // 失敗しても「作っています…」のまま止まらないよう、最後に必ず戻す
    try {
      const result = await generate();
      setExplanation(result.explanation);
      setQuestionCount(result.questionCount);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <article className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">{courseName}</h1>
        <p className="mt-1 text-sm opacity-70">
          {MATERIAL_KIND_LABELS[material.kind]}・
          {formatCreatedAt(material.createdAt)}
        </p>
      </header>

      <figure id="original" className="flex flex-col gap-1">
        <a href={imageUrl} target="_blank" rel="noopener noreferrer">
          {/* 画像の URL は API が毎回作る一時 URL なので、Next.js の <Image> ではなく普通の <img> を使う */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={`${courseName}の${MATERIAL_KIND_LABELS[material.kind]}（元の画像）`}
            className="max-h-[50vh] w-full rounded border border-current/20 bg-current/5 object-contain"
          />
        </a>
        <figcaption className="text-xs opacity-60">
          画像を押すと、別のタブで大きく開きます。
        </figcaption>
      </figure>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">AI の解説</h2>

        {explanation ? (
          <>
            <p
              role="note"
              className="rounded border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-sm leading-relaxed"
            >
              AI の解説は間違うことがあります。
              <a href="#original" className="underline">
                元の画像
              </a>
              と見比べて確かめてください。
            </p>
            {questionCount !== null && (
              <p role="status" className="text-sm font-semibold">
                解説と、確認問題を {questionCount} 問作りました。
              </p>
            )}
            <ExplanationView explanation={explanation} />
          </>
        ) : (
          <div className="flex flex-col gap-3 rounded border border-current/20 p-4">
            <p className="text-sm leading-relaxed">
              {
                "この資料の解説はまだありません。AIに、解説（要約・用語・数式など）と確認問題を作ってもらえます。"
              }
            </p>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="bg-foreground text-background rounded px-4 py-3 font-semibold disabled:opacity-50"
            >
              {generating ? "作っています…" : "解説と確認問題を作る"}
            </button>
            {generating && (
              <p role="status" className="text-center text-xs opacity-70">
                少し時間がかかります。このままお待ちください。
              </p>
            )}
          </div>
        )}
      </section>
    </article>
  );
}
