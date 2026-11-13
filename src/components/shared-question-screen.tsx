// front 担当のファイル。
// 共有された問題の画面の中身（#156）。回答の操作は shared-question-answer.tsx が行う。
// - 開いたときに、問題（GET /api/shared/[shareId]）を API から読み込む。ログインは要らない
// - 問題が見つからない（404：URL が違う、公開されていない）ときは、その案内だけを出す
// - 読み込めなかったときは、理由と「もう一度読み込む」ボタンを出す
//   （この画面はログインしていない人が開くので、ログインへの案内は出さない）
"use client";

import { useEffect, useState } from "react";

import {
  type SharedQuestion,
  sharedQuestionResponseSchema,
} from "@/contracts/questions";

import { ApiError, errorMessage, fetchApi } from "./fetch-api";
import { SharedQuestionAnswer } from "./shared-question-answer";

type Load =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; question: SharedQuestion };

async function loadSharedQuestion(shareId: string) {
  const res = await fetchApi(`/api/shared/${encodeURIComponent(shareId)}`);
  return sharedQuestionResponseSchema.parse(await res.json()).question;
}

export function SharedQuestionScreen({ shareId }: { shareId: string }) {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  // 「もう一度読み込む」を押した回数。変わるたびに読み込み直す
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // 読み込みの途中で画面を離れたら、結果を使わない
    let ignore = false;
    loadSharedQuestion(shareId)
      .then((question) => {
        if (!ignore) setLoad({ status: "ready", question });
      })
      .catch((error: unknown) => {
        if (!ignore) setLoad({ status: "error", error });
      });
    return () => {
      ignore = true;
    };
  }, [shareId, attempt]);

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
    // 無い問題は、読み込み直しても同じなので、案内だけを出す
    if (load.error instanceof ApiError && load.error.status === 404) {
      return (
        <div
          role="alert"
          className="flex flex-col items-center gap-1 py-12 text-center"
        >
          <p className="font-semibold">この問題は見つかりませんでした。</p>
          <p className="text-sm opacity-70">
            URL が正しいか、送ってくれた人に確かめてください。
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div role="alert" className="flex flex-col gap-1">
          <p className="font-semibold">問題を読み込めませんでした</p>
          <p className="text-sm opacity-70">{errorMessage(load.error)}</p>
        </div>
        <button
          type="button"
          onClick={retry}
          className="rounded border border-current/30 px-6 py-3 font-semibold"
        >
          もう一度読み込む
        </button>
      </div>
    );
  }

  return <SharedQuestionAnswer question={load.question} />;
}
