// front 担当のファイル。
// 共有された問題に回答したあとの、正誤と解説（#73）。選択肢の頭の記号（ChoiceMark）もここに置き、問題の画面と共有ページで使い回す。
// - 回答ボタンがあった場所（画面の下）に、入れ替えて出す。画面を下に伸ばさない
//   正解・自分の回答の印は、選択肢の側に付く（shared-question-answer.tsx）
// - 「正解」「不正解」を、色だけでなく文字とアイコンでも伝える
// - 正解のときは、印が小さく弾んで輪が広がる（短く控えめに。動きを減らす設定のときは止まる）
// - 不正解のときは責める色にせず、正しい選択肢と解説を落ち着いて読めるようにする
// - 解説が長いときは、解説の部分だけがスクロールする
"use client";

import { CircleCheck, CircleX } from "lucide-react";
import { useEffect, useRef } from "react";

import type { AnswerResult } from "@/contracts/questions";

import { MascotLine } from "./mascot-line";
import { CHOICE_LABELS } from "./question-format";
import { RichText } from "./math";

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

export function AnswerResultView({ result }: { result: AnswerResult }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // 出したときに、読み上げソフトにも結果を伝える（画面は動かさない）
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section
      aria-labelledby="answer-result-heading"
      className="flex min-h-0 flex-col gap-2 transition-[opacity,translate] duration-250 starting:translate-y-2 starting:opacity-0"
    >
      <div className="flex items-center gap-3">
        {result.correct ? (
          <span className="relative flex size-9 shrink-0 items-center justify-center">
            {/* 広がって消える輪（一度だけ） */}
            <span
              aria-hidden
              className="border-success absolute inset-0.5 scale-[1.8] rounded-full border-2 opacity-0 transition-[scale,opacity] duration-700 ease-out starting:scale-90 starting:opacity-70"
            />
            <CircleCheck
              aria-hidden
              strokeWidth={1.75}
              className="text-success size-9 transition-[scale] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] starting:scale-50"
            />
          </span>
        ) : (
          <CircleX
            aria-hidden
            strokeWidth={1.75}
            className="text-danger size-9 shrink-0"
          />
        )}
        <h2
          id="answer-result-heading"
          ref={headingRef}
          tabIndex={-1}
          className={`text-xl font-bold outline-none ${result.correct ? "text-success" : ""}`}
        >
          {result.correct ? "正解" : "不正解"}
        </h2>
        {!result.correct && (
          <p className="text-muted text-sm whitespace-nowrap">
            正しい答えは
            <span className="font-display text-success mx-1 text-lg font-semibold">
              {CHOICE_LABELS[result.correctIndex]}
            </span>
          </p>
        )}
      </div>

      <MascotLine
        expression={result.correct ? "praise" : "tease"}
        size={48}
        className="text-xs"
      >
        {result.correct
          ? "…正解とか。べつに褒めてないけど？"
          : "あれ、そっち選んじゃった？"}
      </MascotLine>

      <section className="border-accent/50 flex min-h-0 flex-col gap-0.5 border-l-2 pl-3">
        <h3 className="text-muted text-xs font-semibold">解説</h3>
        <div className="max-h-[24dvh] overflow-y-auto overscroll-contain text-sm leading-relaxed [word-break:auto-phrase]">
          <RichText text={result.explanation} />
        </div>
      </section>

      <p className="text-muted text-xs [word-break:auto-phrase]">
        AI が作った問題です。間違いがあるかもしれません。
      </p>
    </section>
  );
}
