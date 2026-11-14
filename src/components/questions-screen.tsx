// front 担当のファイル。
// 問題の確認・公開の画面（#156）。画面は端末の高さに収め、問題の一覧だけを ScrollArea の中でスクロールさせる。
// 一覧と、押したときに開く詳細（Modal）は question-review-list.tsx が行う。
// - 開いたときに、自分の問題（GET /api/questions）を API から読み込む
// - 読み込み中は、一覧の形に近い骨格を出す。読み込めなかったとき・ログインしていないときは、それぞれの表示を出す
"use client";

import { useEffect, useState } from "react";

import { type Question, questionsResponseSchema } from "@/contracts/questions";

import { fetchApi } from "./fetch-api";
import { LoadError } from "./load-error";
import { QuestionReviewList } from "./question-review-list";
import { Screen } from "./ui/screen";

type Load =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; questions: Question[] };

async function loadQuestions() {
  const res = await fetchApi("/api/questions");
  return questionsResponseSchema.parse(await res.json()).questions;
}

// 読み込み中の骨格。一覧の行（番号、問題文 2 行、公開の印）の形を並べる
function QuestionsSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col">
      <span className="sr-only">問題を読み込んでいます</span>
      {[0, 1, 2, 3].map((n) => (
        <div
          key={n}
          aria-hidden
          className="border-line flex items-start gap-3 border-b py-4"
        >
          <div className="skeleton h-4 w-7" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
          </div>
          <div className="skeleton h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

// 読み込み中の画面（loading.tsx でも、同じ枠で出す）
export function QuestionsLoadingScreen() {
  return (
    <Screen label="Questions" title="問題">
      <QuestionsSkeleton />
    </Screen>
  );
}

export function QuestionsScreen() {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  // 「もう一度読み込む」を押した回数。変わるたびに読み込み直す
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // 読み込みの途中で画面を離れたら、結果を使わない
    let ignore = false;
    loadQuestions()
      .then((questions) => {
        if (!ignore) setLoad({ status: "ready", questions });
      })
      .catch((error: unknown) => {
        if (!ignore) setLoad({ status: "error", error });
      });
    return () => {
      ignore = true;
    };
  }, [attempt]);

  function retry() {
    setLoad({ status: "loading" });
    setAttempt((n) => n + 1);
  }

  if (load.status === "loading") {
    return <QuestionsLoadingScreen />;
  }

  if (load.status === "error") {
    return (
      <Screen label="Questions" title="問題">
        <LoadError
          error={load.error}
          title="問題を読み込めませんでした"
          loginMessage="ログインすると、問題を確認して公開できます。"
          onRetry={retry}
        />
      </Screen>
    );
  }

  return <QuestionReviewList questions={load.questions} />;
}
