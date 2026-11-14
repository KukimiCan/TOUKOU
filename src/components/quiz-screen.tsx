// front 担当のファイル。
// 自分の問題を解く画面（/questions?course=<id>&mode=quiz）。
// - 問題は一覧の順のまま、1 問ずつ出す。正解の判定は手元の問題データ（answerIndex）で行い、API には何も送らない
// - 「答え合わせ」で、選択肢に正解・あなたの回答の印を付け、正誤と解説を出す（共有ページと同じ AnswerResultView を使う）
// - 最後の問題のあとは結果（正解数、キャラクター、「もう一度解く」「問題の一覧へ戻る」）
// - 画面は端末の高さに収める。問題文と選択肢が長いときは、その部分だけがスクロールする
"use client";

import { ArrowRight, Check, ChevronLeft, RotateCw, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { Question } from "@/contracts/questions";

import { AnswerResultView, ChoiceMark } from "./answer-result";
import { MascotLine } from "./mascot-line";
import { RichText } from "./math";
import { CHOICE_LABELS, questionNumber } from "./question-format";
import { Button } from "./ui/button";
import { ButtonLink } from "./ui/button-link";
import { Screen } from "./ui/screen";

type Props = {
  // 表示する問題（一覧と同じ順）
  questions: Question[];
  // 科目の名前（見出し）
  title: string;
  // 問題の一覧へ戻るリンク
  listHref: string;
};

export function QuizScreen({ questions, title, listHref }: Props) {
  const total = questions.length;
  // 今の問題の番号（0 始まり）。total に達したら結果を出す
  const [index, setIndex] = useState(0);
  // 選んだ選択肢の番号（まだ選んでいなければ null）
  const [selected, setSelected] = useState<number | null>(null);
  // 答え合わせをしたか
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const finished = index >= total;
  const question = questions[index];

  function check() {
    if (!question || selected === null || answered) return;
    setAnswered(true);
    if (selected === question.answerIndex) setCorrectCount((n) => n + 1);
  }

  function next() {
    setIndex((i) => i + 1);
    setSelected(null);
    setAnswered(false);
  }

  function restart() {
    setIndex(0);
    setSelected(null);
    setAnswered(false);
    setCorrectCount(0);
  }

  return (
    <Screen
      label={
        <Link
          href={listHref}
          className="text-muted hover:text-foreground -ml-1 inline-flex items-center gap-0.5 font-sans text-sm tracking-normal whitespace-nowrap normal-case transition-colors"
        >
          <ChevronLeft aria-hidden className="size-4" />
          問題の一覧
        </Link>
      }
      labelStyle="ja"
      title={title}
    >
      {finished || !question ? (
        <QuizResult
          correct={correctCount}
          total={total}
          listHref={listHref}
          onRestart={restart}
        />
      ) : (
        <>
          <Progress current={index + 1} total={total} />

          {/* 問題の部分。収まらないときだけ、ここがスクロールする */}
          <div
            key={index}
            className="-mx-1 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-1 pb-3"
          >
            <p
              id="quiz-prompt"
              className="mb-4 text-[1.0625rem] leading-relaxed font-semibold [word-break:auto-phrase]"
            >
              <span className="font-display text-muted mr-2 text-sm tracking-wider tabular-nums">
                Q{questionNumber(index + 1)}
              </span>
              <RichText text={question.prompt} />
            </p>
            <div
              role="radiogroup"
              aria-labelledby="quiz-prompt"
              className="flex flex-col gap-2"
            >
              {question.choices.map((choice, i) => (
                <QuizChoice
                  key={i}
                  name={`quiz-choice-${index}`}
                  index={i}
                  choice={choice}
                  selected={selected === i}
                  answered={answered}
                  isAnswer={i === question.answerIndex}
                  onSelect={() => setSelected(i)}
                />
              ))}
            </div>
          </div>

          {/* スマホでは親指の届く画面の下に置く */}
          <div className="border-line flex shrink-0 flex-col gap-2 border-t pt-3 max-sm:mt-auto">
            {answered ? (
              <>
                <AnswerResultView
                  result={{
                    correct: selected === question.answerIndex,
                    correctIndex: question.answerIndex,
                    explanation: question.explanation,
                  }}
                />
                <Button
                  onClick={next}
                  icon={<ArrowRight aria-hidden className="size-4" />}
                  className="w-full py-3 text-base"
                >
                  {index + 1 === total ? "結果を見る" : "次の問題"}
                </Button>
              </>
            ) : (
              <Button
                onClick={check}
                disabled={selected === null}
                icon={<Check aria-hidden className="size-4" />}
                className="w-full py-3 text-base"
              >
                {selected === null ? "選択肢を選んでください" : "答え合わせ"}
              </Button>
            )}
          </div>
        </>
      )}
    </Screen>
  );
}

// 「1 / 5」と、細い線の進み具合
function Progress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex shrink-0 flex-col gap-2">
      <p className="text-muted text-sm tabular-nums">
        <span className="font-display text-foreground text-base font-semibold">
          {current}
        </span>
        <span className="font-display"> / {total}</span>
      </p>
      <div
        role="progressbar"
        aria-label="進み具合"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
        aria-valuetext={`${total} 問中 ${current} 問目`}
        className="bg-line h-0.5 w-full overflow-hidden rounded-sm"
      >
        <div
          className="bg-accent h-full transition-[width] duration-300"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

// 選択肢 1 つ。共有ページの選択肢と同じ見た目で、押しやすさだけ 56px にする
function QuizChoice({
  name,
  index,
  choice,
  selected,
  answered,
  isAnswer,
  onSelect,
}: {
  name: string;
  index: number;
  choice: string;
  selected: boolean;
  answered: boolean;
  isAnswer: boolean;
  onSelect: () => void;
}) {
  const isWrongPick = answered && selected && !isAnswer;

  const tone = answered
    ? isAnswer
      ? "border-success/50 bg-success/10"
      : isWrongPick
        ? "border-danger/40 bg-danger/5"
        : "border-line text-muted"
    : selected
      ? "border-accent bg-accent-soft/60 ring-1 ring-accent ring-inset"
      : "border-line bg-surface hover:border-muted";

  const markTone = answered
    ? isAnswer
      ? "correct"
      : isWrongPick
        ? "wrong"
        : "plain"
    : selected
      ? "selected"
      : "plain";

  return (
    <label
      className={`has-[input:focus-visible]:outline-accent flex min-h-14 items-center gap-3 rounded-sm border px-3.5 py-2.5 transition-colors duration-200 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 ${
        answered ? "cursor-default" : "cursor-pointer active:scale-[0.995]"
      } ${tone}`}
    >
      <input
        type="radio"
        name={name}
        value={index}
        checked={selected}
        disabled={answered}
        onChange={onSelect}
        className="sr-only"
      />
      <ChoiceMark label={CHOICE_LABELS[index]} tone={markTone} />
      <span className="sr-only">{CHOICE_LABELS[index]}.</span>
      <span className="flex-1 leading-relaxed [word-break:auto-phrase]">
        <RichText text={choice} />
      </span>
      {answered && isAnswer && (
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
      {answered && isAnswer && selected && (
        <span className="sr-only">（あなたの回答）</span>
      )}
    </label>
  );
}

// 結果：正解数と、キャラクターの一言。半分以上は smug、全問正解は praise、それ未満は tease
function QuizResult({
  correct,
  total,
  listHref,
  onRestart,
}: {
  correct: number;
  total: number;
  listHref: string;
  onRestart: () => void;
}) {
  const allCorrect = correct === total;
  const halfOrMore = correct * 2 >= total;
  const expression = allCorrect ? "praise" : halfOrMore ? "smug" : "tease";
  const line = allCorrect
    ? "…全問正解とか。べつに褒めてないけど？"
    : halfOrMore
      ? "まあ、半分は取れてるじゃない。"
      : "…ここは、もう一度見直してきて。";

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
      <p className="text-lg [word-break:auto-phrase]">
        {total} 問中
        <span className="font-display text-foreground mx-2 text-5xl font-semibold tabular-nums">
          {correct}
        </span>
        問正解
      </p>
      <MascotLine
        expression={expression}
        size={72}
        className="w-full text-left"
      >
        {line}
      </MascotLine>
      <div className="mt-auto flex w-full flex-col gap-2 pt-2">
        <Button
          onClick={onRestart}
          icon={<RotateCw aria-hidden className="size-4" />}
          className="w-full py-3 text-base"
        >
          もう一度解く
        </Button>
        <ButtonLink href={listHref} variant="secondary" className="w-full">
          問題の一覧へ戻る
        </ButtonLink>
      </div>
    </div>
  );
}
