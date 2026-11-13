// front 担当のファイル。
// 問題の確認・公開（#70）。AI が作った問題を 1 問ずつカードで並べる。
// - 問題文、選択肢（正解に印）、解説、元の資料へのリンクを出し、公開前に中身を確かめられる
// - 「公開済み」「未公開」をバッジで見分けられる
// - 「公開する」を押すと、何が公開されるかを説明する確認を挟んでから公開する
// - 公開済みの問題には、共有 URL をコピーするボタンを出す（#71）
// - 公開は API（POST /api/questions/[id]/publish）を呼ぶ（#156）。失敗したら理由を出し、もう一度押せるようにする
"use client";

import Link from "next/link";
import { useState } from "react";

import {
  type Question,
  publishQuestionResponseSchema,
} from "@/contracts/questions";

import { CopyShareUrl } from "./copy-share-url";
import { errorMessage, fetchApi } from "./fetch-api";
import { CHOICE_LABELS } from "./question-format";

type Props = {
  questions: Question[];
};

// 問題を公開して、共有 URL に使う ID（shareId）を受け取る。何度押しても同じ ID が返る
async function publish(id: string): Promise<{ shareId: string }> {
  const res = await fetchApi(
    `/api/questions/${encodeURIComponent(id)}/publish`,
    { method: "POST" },
  );
  return publishQuestionResponseSchema.parse(await res.json());
}

export function QuestionReviewList({ questions: initial }: Props) {
  const [questions, setQuestions] = useState(initial);

  function handlePublished(id: string, shareId: string) {
    setQuestions((qs) =>
      qs.map((q) => (q.id === id ? { ...q, isPublic: true, shareId } : q)),
    );
  }

  if (questions.length === 0) {
    return (
      <p className="py-8 text-center text-sm opacity-70">
        問題はまだありません。資料の画面で「解説と確認問題を作る」を押すと作れます。
      </p>
    );
  }

  const publicCount = questions.filter((q) => q.isPublic).length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm opacity-70">
        {questions.length} 問（公開済み {publicCount} 問）
      </p>
      <ul className="flex flex-col gap-4">
        {questions.map((question, index) => (
          <li key={question.id}>
            <QuestionCard
              question={question}
              number={index + 1}
              onPublished={(shareId) => handlePublished(question.id, shareId)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuestionCard({
  question,
  number,
  onPublished,
}: {
  question: Question;
  number: number;
  onPublished: (shareId: string) => void;
}) {
  // 確認の表示を出しているか
  const [confirming, setConfirming] = useState(false);
  const [publishing, setPublishing] = useState(false);
  // 公開に失敗したときに出す文（失敗していなければ null）
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    if (publishing) return;
    setPublishing(true);
    setError(null);
    try {
      const { shareId } = await publish(question.id);
      setConfirming(false);
      onPublished(shareId);
    } catch (e) {
      setError(`公開できませんでした。${errorMessage(e)}`);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <article className="flex flex-col gap-4 rounded border border-current/20 p-4">
      <header className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">問題 {number}</h2>
        {question.isPublic ? (
          <span className="rounded-full border border-emerald-600/60 bg-emerald-600/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            公開済み
          </span>
        ) : (
          <span className="rounded-full border border-current/30 px-2 py-0.5 text-xs opacity-80">
            未公開
          </span>
        )}
      </header>

      <p className="leading-relaxed">{question.prompt}</p>

      <ol className="flex flex-col gap-2">
        {question.choices.map((choice, i) => {
          const isAnswer = i === question.answerIndex;
          return (
            <li
              key={i}
              className={`flex items-start gap-2 rounded border px-3 py-2 ${
                isAnswer
                  ? "border-emerald-600/60 bg-emerald-600/10"
                  : "border-current/15"
              }`}
            >
              <span className="font-semibold">{CHOICE_LABELS[i]}.</span>
              <span className="flex-1">{choice}</span>
              {isAnswer && (
                <span className="shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  正解
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <section className="flex flex-col gap-1">
        <h3 className="text-sm font-semibold">解説</h3>
        <p className="text-sm leading-relaxed">{question.explanation}</p>
      </section>

      <p className="text-xs leading-relaxed opacity-70">
        AI が作った問題は間違うことがあります。
        <Link href={`/materials/${question.materialId}`} className="underline">
          元の資料
        </Link>
        と見比べて確かめてください。
      </p>

      {question.isPublic ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            公開中です。URL を知っている人が回答できます。
          </p>
          {question.shareId && <CopyShareUrl shareId={question.shareId} />}
        </div>
      ) : confirming ? (
        <div className="flex flex-col gap-3 rounded border border-amber-500/60 bg-amber-500/10 p-3">
          <p className="text-sm leading-relaxed">
            公開すると、URL
            を知っている人は誰でも、この問題文・選択肢・解説を見られます。元の板書画像は公開されません。
          </p>
          {error && (
            <p role="alert" className="text-sm font-semibold">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="bg-foreground text-background flex-1 rounded px-4 py-3 font-semibold disabled:opacity-50"
            >
              {publishing ? "公開しています…" : "公開する"}
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
              disabled={publishing}
              className="rounded border border-current/30 px-4 py-3 disabled:opacity-50"
            >
              やめる
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded border border-current/40 px-4 py-3 font-semibold"
        >
          確認して公開する
        </button>
      )}
    </article>
  );
}
