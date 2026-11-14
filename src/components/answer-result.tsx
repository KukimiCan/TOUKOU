// front 担当のファイル。
// 共有された問題に回答したあとの、正誤と解説（#73）。選択肢の頭の記号（ChoiceMark）もここに置き、問題の画面と共有ページで使い回す。
// - 「正解」「不正解」を、色だけでなく文字とアイコンでも伝える
// - 正解のときは、印が小さく弾んで輪が広がる（短く控えめに。動きを減らす設定のときは止まる）
// - 不正解のときは責める色にせず、正しい選択肢と解説を落ち着いて読めるようにする
// - 出したときに、ここへ画面を動かして読み上げソフトにも伝える（スマホでは回答ボタンの下に隠れやすいため）
"use client";

import { CircleCheck, CircleX } from "lucide-react";
import { useEffect, useRef } from "react";

import type { AnswerResult } from "@/contracts/questions";

import { CHOICE_LABELS } from "./question-format";

type Props = {
  result: AnswerResult;
  choices: string[];
};

type MarkTone = "plain" | "selected" | "correct" | "wrong";

const markTones: Record<MarkTone, string> = {
  plain: "border-line text-muted",
  selected: "border-accent bg-accent text-background",
  correct: "border-success bg-success text-background",
  wrong: "border-danger/60 text-danger",
};

// 選択肢の頭の記号（A、B…）。選んだもの・正解は塗りつぶす
export function ChoiceMark({
  label,
  tone = "plain",
}: {
  label: string;
  tone?: MarkTone;
}) {
  return (
    <span
      aria-hidden
      className={`font-display inline-flex size-7 shrink-0 items-center justify-center rounded-sm border text-base font-semibold transition-colors ${markTones[tone]}`}
    >
      {label}
    </span>
  );
}

export function AnswerResultView({ result, choices }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const heading = headingRef.current;
    if (!heading) return;
    heading.focus({ preventScroll: true });
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    heading.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  return (
    <section
      aria-labelledby="answer-result-heading"
      className="flex flex-col gap-6 transition-[opacity,translate] duration-250 starting:translate-y-2 starting:opacity-0"
    >
      {result.correct ? (
        <div className="border-success/40 bg-success/10 flex items-center gap-4 rounded-sm border p-4">
          <span className="relative flex size-12 shrink-0 items-center justify-center">
            {/* 広がって消える輪（一度だけ） */}
            <span
              aria-hidden
              className="border-success absolute inset-1 scale-[1.7] rounded-full border-2 opacity-0 transition-[scale,opacity] duration-700 ease-out starting:scale-90 starting:opacity-70"
            />
            <CircleCheck
              aria-hidden
              strokeWidth={1.75}
              className="text-success size-11 transition-[scale] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] starting:scale-50"
            />
          </span>
          <div className="flex flex-col gap-0.5">
            <h2
              id="answer-result-heading"
              ref={headingRef}
              tabIndex={-1}
              className="text-success scroll-mt-6 text-2xl font-bold outline-none"
            >
              正解
            </h2>
            <p className="text-sm leading-relaxed [word-break:auto-phrase]">
              解説で、なぜそうなるかも確かめておきましょう。
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="border-line bg-surface flex items-center gap-4 rounded-sm border p-4">
            <CircleX
              aria-hidden
              strokeWidth={1.75}
              className="text-danger size-11 shrink-0"
            />
            <div className="flex flex-col gap-0.5">
              <h2
                id="answer-result-heading"
                ref={headingRef}
                tabIndex={-1}
                className="scroll-mt-6 text-2xl font-bold outline-none"
              >
                不正解
              </h2>
              <p className="text-muted text-sm leading-relaxed [word-break:auto-phrase]">
                正しい答えと解説を読んで、次に生かしましょう。
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-muted text-xs font-semibold">正しい答え</p>
            <p className="flex items-start gap-3">
              <ChoiceMark
                label={CHOICE_LABELS[result.correctIndex]}
                tone="correct"
              />
              <span className="sr-only">
                {CHOICE_LABELS[result.correctIndex]}.
              </span>
              <span className="pt-0.5 leading-relaxed font-semibold [word-break:auto-phrase]">
                {choices[result.correctIndex]}
              </span>
            </p>
          </div>
        </div>
      )}

      <section className="border-accent/50 flex flex-col gap-1 border-l-2 pl-3">
        <h3 className="text-muted text-xs font-semibold">解説</h3>
        <p className="leading-relaxed [word-break:auto-phrase]">
          {result.explanation}
        </p>
      </section>

      <p className="text-muted text-xs leading-relaxed [word-break:auto-phrase]">
        この問題と解説は AI
        が作り、作った人が確認して公開したものです。間違っていることもあります。
      </p>
    </section>
  );
}
