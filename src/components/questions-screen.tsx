// front 担当のファイル。
// 問題の確認・公開の画面の中身（#156）。問題の表示と公開は question-review-list.tsx が行う。
// - 開いたときに、自分の問題（GET /api/questions）を API から読み込む
// - 読み込み中・読み込めなかったとき・ログインしていないときは、それぞれの表示を出す
"use client";

import { useEffect, useState } from "react";

import { type Question, questionsResponseSchema } from "@/contracts/questions";

import { fetchApi } from "./fetch-api";
import { LoadError } from "./load-error";
import { QuestionReviewList } from "./question-review-list";

type Load =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; questions: Question[] };

async function loadQuestions() {
  const res = await fetchApi("/api/questions");
  return questionsResponseSchema.parse(await res.json()).questions;
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
    return (
      <p role="status" className="py-12 text-center text-sm opacity-70">
        問題を読み込んでいます…
      </p>
    );
  }

  if (load.status === "error") {
    return (
      <LoadError
        error={load.error}
        title="問題を読み込めませんでした"
        loginMessage="ログインすると、問題を確認して公開できます。"
        onRetry={retry}
      />
    );
  }

  return <QuestionReviewList questions={load.questions} />;
}
