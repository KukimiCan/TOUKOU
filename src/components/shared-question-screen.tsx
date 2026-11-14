// front 担当のファイル。
// 共有された問題の画面の中身（#156）。回答の操作は shared-question-answer.tsx が行う。
// - 開いたときに、問題（GET /api/shared/[shareId]）を API から読み込む。ログインは要らない
// - 読み込み中は、問題の形に近い骨格を出す（page.tsx の読み込み中の表示でも使う）。どの表示も画面の高さに収める
// - 問題が見つからない（404：URL が違う、公開されていない）ときは、その案内だけを出す
// - 読み込めなかったときは、理由と「もう一度読み込む」ボタンを出す
//   （この画面はログインしていない人が開くので、ログインへの案内は出さない）
"use client";

import { CloudOff, RotateCw, SearchX } from "lucide-react";
import { useEffect, useState } from "react";

import {
  type SharedQuestion,
  sharedQuestionResponseSchema,
} from "@/contracts/questions";

import { ApiError, errorMessage, fetchApi } from "./fetch-api";
import { SharedQuestionAnswer } from "./shared-question-answer";
import { Button } from "./ui/button";

type Load =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; question: SharedQuestion };

async function loadSharedQuestion(shareId: string) {
  const res = await fetchApi(`/api/shared/${encodeURIComponent(shareId)}`);
  return sharedQuestionResponseSchema.parse(await res.json()).question;
}

// 読み込み中の骨格（問題文、選択肢、回答ボタン）
export function SharedQuestionSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-1 flex-col">
      <span className="sr-only">問題を読み込んでいます</span>
      <div aria-hidden className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-5 w-full" />
          <div className="skeleton h-5 w-2/3" />
        </div>
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((n) => (
            <div key={n} className="skeleton h-12 w-full" />
          ))}
        </div>
      </div>
      <div aria-hidden className="border-line border-t pt-3">
        <div className="skeleton h-12 w-full" />
      </div>
    </div>
  );
}

// 読み込めなかったときなどの案内（アイコン、見出し、説明、必要ならボタン）
function Notice({
  icon,
  title,
  children,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 pb-8 text-center">
      <span className="bg-accent-soft text-accent flex size-12 items-center justify-center rounded-full">
        {icon}
      </span>
      <div role="alert" className="flex flex-col gap-1">
        <p className="font-semibold">{title}</p>
        <p className="text-muted text-sm [word-break:auto-phrase]">
          {children}
        </p>
      </div>
      {action}
    </div>
  );
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
    return <SharedQuestionSkeleton />;
  }

  if (load.status === "error") {
    // 無い問題は、読み込み直しても同じなので、案内だけを出す
    if (load.error instanceof ApiError && load.error.status === 404) {
      return (
        <Notice
          icon={<SearchX aria-hidden className="size-6" />}
          title="この問題は見つかりませんでした"
        >
          URL が正しいか、送ってくれた人に確かめてください。
        </Notice>
      );
    }

    return (
      <Notice
        icon={<CloudOff aria-hidden className="size-6" />}
        title="問題を読み込めませんでした"
        action={
          <Button
            variant="secondary"
            onClick={retry}
            icon={<RotateCw aria-hidden className="size-4" />}
            className="whitespace-nowrap"
          >
            もう一度読み込む
          </Button>
        }
      >
        {errorMessage(load.error)}
      </Notice>
    );
  }

  return <SharedQuestionAnswer question={load.question} />;
}
