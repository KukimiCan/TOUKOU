// front 担当のファイル。
// 共有された問題に回答する（#72）。選択肢を 1 つ選んで「回答する」を押す。
// - 回答前の問題には、正解も解説も入っていない（src/contracts/questions.ts の SharedQuestion）
// - 回答したら、選択肢に正解・自分の回答の印を付け、下に正誤と解説を出す（#73）
// - 回答は API（POST /api/shared/[shareId]/answers）に送る（#156）。失敗したら理由を出し、もう一度押せるようにする
"use client";

import { useState } from "react";

import {
  type AnswerResult,
  type SharedQuestion,
  answerResultResponseSchema,
} from "@/contracts/questions";

import { AnswerResultView } from "./answer-result";
import { errorMessage, fetchApi } from "./fetch-api";
import { CHOICE_LABELS } from "./question-format";

type Props = {
  question: SharedQuestion;
};

// 回答を送って、正誤と解説を受け取る
async function submitAnswer(
  shareId: string,
  choiceIndex: number,
): Promise<AnswerResult> {
  const res = await fetchApi(
    `/api/shared/${encodeURIComponent(shareId)}/answers`,
    { method: "POST", body: { choiceIndex } },
  );
  return answerResultResponseSchema.parse(await res.json()).result;
}

export function SharedQuestionAnswer({ question }: Props) {
  // 選んだ選択肢の番号（まだ選んでいなければ null）
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AnswerResult | null>(null);
  // 回答を送れなかったときに出す文（失敗していなければ null）
  const [error, setError] = useState<string | null>(null);

  const answered = result !== null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected === null || submitting || answered) return;
    setSubmitting(true);
    setError(null);
    try {
      setResult(await submitAnswer(question.shareId, selected));
    } catch (e) {
      setError(`回答を送れませんでした。${errorMessage(e)}`);
    } finally {
      setSubmitting(false);
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
          {error}
        </p>
      )}

      {answered && (
        <AnswerResultView result={result} choices={question.choices} />
      )}
    </form>
  );
}
