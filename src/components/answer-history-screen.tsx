// front 担当のファイル。
// 解いた問題の履歴の画面。画面は端末の高さに収め、一覧だけを ScrollArea の中でスクロールさせる。
// - 開いたときに、履歴（GET /api/answers/history）を読み込む。ログインしていなければ、ログインへの案内を出す
// - 行は「正誤のアイコン・問題文 2 行・回答した日時」。押すと共有ページ（/q/<shareId>）を開く
// - 0 件のときは短い文とキャラクター。読み込み中は一覧の形に近い骨格を出す
"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  type AnswerHistoryItem,
  answerHistoryResponseSchema,
} from "@/contracts/history";

import { fetchApi } from "./fetch-api";
import { LoadError } from "./load-error";
import { MascotLine } from "./mascot-line";
import { Screen, ScrollArea } from "./ui/screen";

type Load =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; items: AnswerHistoryItem[] };

async function loadHistory() {
  const res = await fetchApi("/api/answers/history");
  return answerHistoryResponseSchema.parse(await res.json()).items;
}

const dateFormat = new Intl.DateTimeFormat("ja-JP", {
  month: "numeric",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function HistorySkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col">
      <span className="sr-only">履歴を読み込んでいます</span>
      {[0, 1, 2, 3, 4].map((n) => (
        <div
          key={n}
          aria-hidden
          className="border-line flex items-start gap-3 border-b py-4"
        >
          <div className="skeleton size-5 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-2/3" />
          </div>
          <div className="skeleton h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function AnswerHistoryScreen() {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  // 「もう一度読み込む」を押した回数。変わるたびに読み込み直す
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // 読み込みの途中で画面を離れたら、結果を使わない
    let ignore = false;
    loadHistory()
      .then((items) => {
        if (!ignore) setLoad({ status: "ready", items });
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

  return (
    <Screen label="History" title="解いた問題">
      {load.status === "loading" ? (
        <HistorySkeleton />
      ) : load.status === "error" ? (
        <LoadError
          error={load.error}
          title="履歴を読み込めませんでした"
          loginMessage="ログインしたまま共有された問題を解くと、ここに履歴が残ります。"
          onRetry={retry}
        />
      ) : load.items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 pb-8 text-center">
          <MascotLine expression="smug" size={72}>
            まだ何も解いてないじゃない
          </MascotLine>
          <p className="text-muted text-sm [word-break:auto-phrase]">
            ログインして共有された問題を解くと、ここに残ります。
          </p>
        </div>
      ) : (
        <ScrollArea className="border-line -mx-4 border-t px-4 sm:-mx-6 sm:px-6">
          <ul aria-label="解いた問題の一覧">
            {load.items.map((item, i) => (
              <li key={`${item.shareId}-${item.answeredAt}-${i}`}>
                <HistoryRow item={item} />
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </Screen>
  );
}

function HistoryRow({ item }: { item: AnswerHistoryItem }) {
  return (
    <Link
      href={`/q/${encodeURIComponent(item.shareId)}`}
      className="border-line hover:bg-surface flex items-start gap-3 border-b py-3.5"
    >
      <span
        className={`flex size-5 shrink-0 items-center justify-center pt-0.5 ${
          item.correct ? "text-success" : "text-muted"
        }`}
      >
        {item.correct ? (
          <Check aria-hidden className="size-5" />
        ) : (
          <X aria-hidden className="size-5" />
        )}
        <span className="sr-only">{item.correct ? "正解" : "不正解"}</span>
      </span>
      <span className="line-clamp-2 min-w-0 flex-1 text-[0.9375rem] leading-relaxed [word-break:auto-phrase]">
        {item.prompt}
      </span>
      <time
        dateTime={item.answeredAt}
        className="font-display text-muted shrink-0 pt-px text-sm whitespace-nowrap tabular-nums"
      >
        {dateFormat.format(new Date(item.answeredAt))}
      </time>
    </Link>
  );
}
