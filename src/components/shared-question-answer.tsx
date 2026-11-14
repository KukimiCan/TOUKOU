// front 担当のファイル。
// 共有された問題に回答する（#72）。選択肢を 1 つ選んで「回答する」を押す。
// - 問題文・選択肢・「回答する」が 1 画面に収まる。選択肢が多くて収まらないときは、問題の部分だけがスクロールし、
//   「回答する」は常に見えている
// - 選択肢は行全体が押せる。選んだものは色と塗りつぶした記号ではっきり分かる
// - 回答前の問題には、正解も解説も入っていない（src/contracts/questions.ts の SharedQuestion）
// - 回答したら、選択肢に正解・自分の回答の印を付け、「回答する」の場所に正誤と解説を入れ替えて出す（#73）
// - 回答は API（POST /api/shared/[shareId]/answers）に送る（#156）。失敗したら理由を出し、もう一度押せるようにする
"use client";

import { Check, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      {/* 問題の部分。収まらないときだけ、ここがスクロールする（広い画面では、結果が選択肢のすぐ下に来るよう伸ばさない） */}
      <div className="-mx-1 min-h-0 overflow-y-auto overscroll-contain px-1 pb-3">
        <fieldset disabled={submitting || answered} className="flex flex-col">
          <legend className="mb-4 text-[1.0625rem] leading-relaxed font-semibold [word-break:auto-phrase]">
            {question.prompt}
          </legend>
          <div className="flex flex-col gap-2">
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
      </div>

      {/* スマホでは親指の届く画面の下に、広い画面では選択肢のすぐ下に置く */}
      <div className="border-line flex shrink-0 flex-col gap-2 border-t pt-3 max-sm:mt-auto">
        {answered ? (
          <AnswerResultView result={result} />
        ) : (
          <>
            {error && (
              <p
                role="alert"
                className="text-danger text-sm [word-break:auto-phrase]"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={selected === null}
              loading={submitting}
              icon={<Send aria-hidden className="size-4" />}
              className="w-full py-3 text-base"
            >
              {submitting
                ? "答え合わせをしています"
                : selected === null
                  ? "選択肢を選んでください"
                  : "回答する"}
            </Button>
          </>
        )}
      </div>
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

  // 答え合わせのあと、自分の回答が問題の部分の外に隠れていたら、見える位置まで動かす
  const ref = useRef<HTMLLabelElement>(null);
  useEffect(() => {
    if (answered && selected) ref.current?.scrollIntoView({ block: "nearest" });
  }, [answered, selected]);

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
      ref={ref}
      className={`has-[input:focus-visible]:outline-accent flex min-h-12 items-center gap-3 rounded-sm border px-3.5 py-2.5 transition-colors duration-200 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 ${
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
      {isCorrect && (
        <span className="text-success inline-flex shrink-0 items-center gap-1 text-xs font-semibold whitespace-nowrap">
          <Check aria-hidden className="size-3.5" />
          正解
        </span>
      )}
      {isWrongPick && (
        <span className="text-danger inline-flex shrink-0 items-center gap-1 text-xs font-semibold whitespace-nowrap">
          <X aria-hidden className="size-3.5" />
          あなたの回答
        </span>
      )}
      {answered && isCorrect && selected && (
        <span className="sr-only">（あなたの回答）</span>
      )}
    </label>
  );
}
