// front 担当のファイル。
// 問題の確認・公開の画面の中身（#156）。問題の表示と公開は question-review-list.tsx が行う。
// - 開いたときに、自分の問題（GET /api/questions）を API から読み込む
// - 読み込み中は、問題の形に近い骨格を出す。読み込めなかったとき・ログインしていないときは、それぞれの表示を出す
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

// 画面の見出しと説明（page.tsx と loading.tsx で同じものを出す）
export function QuestionsHeader() {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold">問題</h1>
      <p className="text-muted text-sm leading-relaxed [word-break:auto-phrase]">
        AI
        が資料から作った確認問題です。問題文と解説を確かめてから公開すると、URL
        で友達に送れます。
      </p>
    </header>
  );
}

// 読み込み中の骨格。問題 1 つ分（見出し、問題文、選択肢、ボタン）の形を 2 つ並べる
export function QuestionsSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">問題を読み込んでいます</span>
      <div className="skeleton h-4 w-40" />
      {[0, 1].map((n) => (
        <div
          key={n}
          className="border-line flex flex-col gap-3 border-t pt-5"
          aria-hidden
        >
          <div className="flex items-center justify-between">
            <div className="skeleton h-5 w-12" />
            <div className="skeleton h-5 w-16" />
          </div>
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
          <div className="mt-1 flex flex-col gap-2">
            <div className="skeleton h-11 w-full" />
            <div className="skeleton h-11 w-full" />
            <div className="skeleton h-11 w-full" />
          </div>
          <div className="skeleton mt-1 h-11 w-full" />
        </div>
      ))}
    </div>
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
    return <QuestionsSkeleton />;
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
