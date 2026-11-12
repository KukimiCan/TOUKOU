// front 担当のファイル。
// 共有された問題に回答する（#72）。選択肢を 1 つ選んで「回答する」を押す。
// - 回答前の問題には、正解も解説も入っていない（src/contracts/questions.ts の SharedQuestion）
// - 回答したら、選択肢に正解・自分の回答の印を付け、下に正誤と解説を出す（#73）
// - 回答はいまは仮の動き（少し待って仮データの結果を返す）。API（POST /api/shared/[shareId]/answers）につなぐのは別の issue
"use client";

import { useState } from "react";

import type { AnswerResult, SharedQuestion } from "@/contracts/questions";
import { mockPreviewAnswer } from "@/mocks/shared-questions-preview";

import { AnswerResultView } from "./answer-result";
import { CHOICE_LABELS } from "./question-format";

type Props = {
  question: SharedQuestion;
};

// 【仮の動き。API につなぐときに置き換える】回答を送る代わりに、少し待って仮データの結果を返す
async function submitAnswer(
  shareId: string,
  choiceIndex: number,
): Promise<AnswerResult | null> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return mockPreviewAnswer(shareId, choiceIndex);
}

export function SharedQuestionAnswer({ question }: Props) {
  // 選んだ選択肢の番号（まだ選んでいなければ null）
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [error, setError] = useState(false);

  const answered = result !== null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected === null || submitting || answered) return;
    setSubmitting(true);
    setError(false);
    const answer = await submitAnswer(question.shareId, selected);
    setSubmitting(false);
    if (answer) {
      setResult(answer);
    } else {
      setError(true);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <fieldset
        disabled={submitting || answered}
        className="flex flex-col gap-3"
      >
        <legend className="mb-3 text-lg leading-relaxed font-semibold">
          {question.prompt}
        </legend>
        {question.choices.map((choice, i) => {
          // 回答したあとは、正しい選択肢と、自分が選んだ選択肢に印を付ける
          const isCorrect = answered && i === result.correctIndex;
          const isWrongPick = answered && i === selected && !isCorrect;
          return (
            <label
              key={i}
              className={`flex items-start gap-3 rounded border px-4 py-3 ${
                answered ? "cursor-default" : "cursor-pointer"
              } ${
                isCorrect
                  ? "border-emerald-600/60 bg-emerald-600/10"
                  : isWrongPick
                    ? "border-red-600/60 bg-red-600/10"
                    : selected === i
                      ? "border-foreground bg-current/10"
                      : "border-current/20"
              }`}
            >
              <input
                type="radio"
                name="choice"
                value={i}
                checked={selected === i}
                onChange={() => setSelected(i)}
                className="mt-1 size-4 shrink-0"
              />
              <span className="font-semibold">{CHOICE_LABELS[i]}.</span>
              <span className="flex-1">{choice}</span>
              {answered && (isCorrect || i === selected) && (
                <span className="flex shrink-0 flex-col items-end gap-0.5 text-xs font-semibold">
                  {isCorrect && (
                    <span className="text-emerald-700 dark:text-emerald-400">
                      正解
                    </span>
                  )}
                  {i === selected && (
                    <span className="opacity-80">あなたの回答</span>
                  )}
                </span>
              )}
            </label>
          );
        })}
      </fieldset>

      {!answered && (
        <button
          type="submit"
          disabled={selected === null || submitting}
          className="bg-foreground text-background rounded px-4 py-3 font-semibold disabled:opacity-50"
        >
          {submitting ? "送っています…" : "回答する"}
        </button>
      )}

      {error && (
        <p role="alert" className="text-sm">
          回答を送れませんでした。時間をおいて、もう一度試してください。
        </p>
      )}

      {answered && (
        <AnswerResultView result={result} choices={question.choices} />
      )}
    </form>
  );
}
