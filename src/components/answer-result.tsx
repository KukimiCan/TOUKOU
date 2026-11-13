// front 担当のファイル。
// 共有された問題に回答したあとの、正誤と解説（#73）。
// - 「正解」「不正解」を、色だけでなく文字と印でも伝える
// - 不正解のときは、正しい選択肢がどれだったかも書く
// - 出したときに、ここへ画面を動かして読み上げソフトにも伝える（スマホでは回答ボタンの下に隠れやすいため）
"use client";

import { useEffect, useRef } from "react";

import type { AnswerResult } from "@/contracts/questions";

import { CHOICE_LABELS } from "./question-format";

type Props = {
  result: AnswerResult;
  choices: string[];
};

export function AnswerResultView({ result, choices }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
    headingRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const correctLabel = `${CHOICE_LABELS[result.correctIndex]}. ${choices[result.correctIndex]}`;

  return (
    <section className="flex flex-col gap-4">
      <div
        className={`flex flex-col gap-1 rounded border p-4 ${
          result.correct
            ? "border-emerald-600/60 bg-emerald-600/10"
            : "border-red-600/60 bg-red-600/10"
        }`}
      >
        <h2
          ref={headingRef}
          tabIndex={-1}
          className={`flex scroll-mt-4 items-center gap-2 text-2xl font-bold outline-none ${
            result.correct
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-red-700 dark:text-red-400"
          }`}
        >
          {result.correct ? (
            <>
              {/* 丸の印 */}
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="8" />
              </svg>
              正解
            </>
          ) : (
            <>
              {/* バツの印 */}
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
              不正解
            </>
          )}
        </h2>
        {!result.correct && (
          <p className="text-sm">正しい答えは「{correctLabel}」です。</p>
        )}
      </div>

      <section className="flex flex-col gap-1">
        <h3 className="font-semibold">解説</h3>
        <p className="leading-relaxed">{result.explanation}</p>
      </section>

      <p className="text-xs leading-relaxed opacity-70">
        この問題と解説は AI
        が作り、作った人が確認して公開したものです。間違っていることもあります。
      </p>
    </section>
  );
}
