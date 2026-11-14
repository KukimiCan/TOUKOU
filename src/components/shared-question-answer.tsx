// front 担当のファイル。
// 共有された問題に回答する（#72）。選択肢を 1 つ選んで「回答する」を押す。
// - 上に「選ぶ → 回答する → 答え合わせ」の流れを出し、いまどこかが分かるようにする（初めて開いた人向け）
// - 選択肢は行全体が押せる（スマホでも 56px 以上）。選んだものは色と塗りつぶした記号ではっきり分かる
// - 回答前の問題には、正解も解説も入っていない（src/contracts/questions.ts の SharedQuestion）
// - 回答したら、選択肢に正解・自分の回答の印を付け、下に正誤と解説を出す（#73）
// - 回答は API（POST /api/shared/[shareId]/answers）に送る（#156）。失敗したら理由を出し、もう一度押せるようにする
"use client";

import { Check, Send } from "lucide-react";
import { useState } from "react";

import {
  type AnswerResult,
  type SharedQuestion,
  answerResultResponseSchema,
} from "@/contracts/questions";

import { AnswerResultView, ChoiceMark } from "./answer-result";
import { errorMessage, fetchApi } from "./fetch-api";
import { CHOICE_LABELS } from "./question-format";
import { Button } from "./ui/button";

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

const STEPS = ["選ぶ", "回答する", "答え合わせ"];

// 回答の流れと、いまの段階
function Steps({ current }: { current: number }) {
  return (
    <ol aria-label="回答の流れ" className="flex items-center gap-2 text-xs">
      {STEPS.map((step, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li
            key={step}
            aria-current={now ? "step" : undefined}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            {i > 0 && (
              <span
                aria-hidden
                className={`h-px w-4 transition-colors sm:w-6 ${done || now ? "bg-accent" : "bg-line"}`}
              />
            )}
            <span
              className={`flex items-center gap-1.5 transition-colors ${
                now
                  ? "text-foreground font-semibold"
                  : done
                    ? "text-accent"
                    : "text-muted"
              }`}
            >
              <span
                aria-hidden
                className={`font-display inline-flex size-5 items-center justify-center rounded-full border text-xs transition-colors ${
                  now
                    ? "border-foreground bg-foreground text-background"
                    : done
                      ? "border-accent text-accent"
                      : "border-line"
                }`}
              >
                {done ? <Check className="size-3" /> : i + 1}
              </span>
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function SharedQuestionAnswer({ question }: Props) {
  // 選んだ選択肢の番号（まだ選んでいなければ null）
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AnswerResult | null>(null);
  // 回答を送れなかったときに出す文（失敗していなければ null）
  const [error, setError] = useState<string | null>(null);

  const answered = result !== null;
  const step = answered ? 2 : selected === null ? 0 : 1;

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Steps current={step} />

      <fieldset disabled={submitting || answered} className="flex flex-col">
        <legend className="mb-5 text-lg leading-relaxed font-semibold [word-break:auto-phrase]">
          {question.prompt}
        </legend>
        <div className="flex flex-col gap-2.5">
          {question.choices.map((choice, i) => (
            <ChoiceOption
              key={i}
              index={i}
              choice={choice}
              selected={selected === i}
              answered={answered}
              isCorrect={answered && i === result.correctIndex}
              onSelect={() => setSelected(i)}
            />
          ))}
        </div>
      </fieldset>

      {!answered && (
        <div className="flex flex-col gap-2">
          <Button
            type="submit"
            disabled={selected === null}
            loading={submitting}
            icon={<Send aria-hidden className="size-4" />}
            className="w-full py-3.5 text-base whitespace-nowrap"
          >
            {submitting ? "答え合わせをしています" : "回答する"}
          </Button>
          {selected === null && (
            <p className="text-muted text-center text-xs">
              選択肢を 1 つ選ぶと、回答できます
            </p>
          )}
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="text-danger text-sm leading-relaxed [word-break:auto-phrase]"
        >
          {error}
        </p>
      )}

      {answered && (
        <AnswerResultView result={result} choices={question.choices} />
      )}
    </form>
  );
}

function ChoiceOption({
  index,
  choice,
  selected,
  answered,
  isCorrect,
  onSelect,
}: {
  index: number;
  choice: string;
  selected: boolean;
  answered: boolean;
  isCorrect: boolean;
  onSelect: () => void;
}) {
  const isWrongPick = answered && selected && !isCorrect;

  // 回答の前は「選んだか」、回答のあとは「正解か・自分の回答か」で見た目を変える
  const tone = isCorrect
    ? "border-success/50 bg-success/10"
    : isWrongPick
      ? "border-danger/40 bg-danger/5"
      : answered
        ? "border-line text-muted"
        : selected
          ? "border-accent bg-accent-soft/60 ring-1 ring-accent ring-inset"
          : "border-line bg-surface hover:border-muted";

  const markTone = isCorrect
    ? "correct"
    : isWrongPick
      ? "wrong"
      : selected && !answered
        ? "selected"
        : "plain";

  return (
    <label
      className={`has-[input:focus-visible]:outline-accent flex min-h-14 items-center gap-3 rounded-sm border px-4 py-3 transition-colors duration-200 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 ${
        answered ? "cursor-default" : "cursor-pointer active:scale-[0.995]"
      } ${tone}`}
    >
      <input
        type="radio"
        name="choice"
        value={index}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <ChoiceMark label={CHOICE_LABELS[index]} tone={markTone} />
      <span className="sr-only">{CHOICE_LABELS[index]}.</span>
      <span className="flex-1 leading-relaxed [word-break:auto-phrase]">
        {choice}
      </span>
      {answered && (isCorrect || selected) && (
        <span className="flex shrink-0 flex-col items-end gap-0.5 text-xs font-semibold whitespace-nowrap">
          {isCorrect && (
            <span className="text-success inline-flex items-center gap-1">
              <Check aria-hidden className="size-3.5" />
              正解
            </span>
          )}
          {selected && <span className="text-muted">あなたの回答</span>}
        </span>
      )}
    </label>
  );
}
