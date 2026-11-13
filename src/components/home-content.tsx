// front 担当のファイル。
// ホーム画面の中身（#65）。/api/home を取得し、次の授業カード・空き時間・短い復習を出す。
// - 読み込み中：カードの形の枠に「読み込んでいます…」
// - ログインしていない（401）：ログインへの案内（ログイン画面は #74）
// - それ以外の失敗：エラーの文と「もう一度読み込む」ボタン
//
// ホームを開いたままでも次の授業に進むよう、次のときに取り直す（取り直す間は今の表示を残す）。
// - 授業の終了時刻を過ぎたとき（API は「まだ終わっていない授業のうち一番近いもの」を返すので、次の授業に変わる）
// - 別のタブやアプリから戻ってきたとき（スマホでは、画面を消している間タイマーが止まることがあるため）
"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { homeResponseSchema, type HomeResponse } from "@/contracts/home";

import { FreeTimeSuggestions } from "./free-time-suggestions";
import { NextClassCard } from "./next-class-card";
import { NoCourses } from "./no-courses";
import { ReviewList } from "./review-list";

type State =
  | { status: "loading" }
  | { status: "unauthorized" }
  | { status: "error" }
  | { status: "ready"; home: HomeResponse };

// /api/home を取得する。受け取ったデータは contracts の zod で形をチェックする
async function fetchHome(): Promise<State> {
  try {
    const res = await fetch("/api/home", { cache: "no-store" });
    if (res.status === 401) return { status: "unauthorized" };
    if (!res.ok) return { status: "error" };
    return {
      status: "ready",
      home: homeResponseSchema.parse(await res.json()),
    };
  } catch {
    // 通信できなかった、または形が違った
    return { status: "error" };
  }
}

export function HomeContent() {
  const [state, setState] = useState<State>({ status: "loading" });
  // 取り直しが重なったとき、古い結果で上書きしないよう、最後に頼んだ番号を覚えておく
  const latest = useRef(0);

  const load = useCallback(async () => {
    const id = ++latest.current;
    const result = await fetchHome();
    if (id !== latest.current) return;
    // 表示中に取り直して失敗したときは、今の表示を残す（ログインが切れたときは案内を出す）
    setState((prev) =>
      prev.status === "ready" && result.status === "error" ? prev : result,
    );
  }, []);

  // 最初の読み込み
  useEffect(() => {
    void load();
  }, [load]);

  // 別のタブやアプリから戻ってきたら取り直す
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  // 授業の終了時刻を過ぎたら取り直す
  const home = state.status === "ready" ? state.home : null;
  useEffect(() => {
    const endsAt = home?.nextClass?.endsAt;
    if (!endsAt) return;
    const remaining = new Date(endsAt).getTime() - Date.now();
    // 終了の 1 秒後に取り直す。端末とサーバーの時計のずれで同じ授業が返ってきたら、1 分後にもう一度
    const delay = remaining > 0 ? remaining + 1000 : 60_000;
    const timer = setTimeout(() => void load(), delay);
    return () => clearTimeout(timer);
  }, [home, load]);

  function retry() {
    setState({ status: "loading" });
    void load();
  }

  if (state.status === "loading") {
    return (
      <section
        aria-busy="true"
        className="flex min-h-40 items-center justify-center rounded-lg border border-current/20 px-5 py-4"
      >
        <p className="text-sm opacity-70">読み込んでいます…</p>
      </section>
    );
  }

  if (state.status === "unauthorized") {
    return (
      <section className="flex flex-col gap-3">
        <p className="text-2xl font-bold">ログインしてください</p>
        <p className="text-sm opacity-70">
          ログインすると、ここに次の授業の場所と、移動を始める時刻が出ます。
        </p>
        <Link href="/login" className="text-base font-semibold underline">
          ログインする
        </Link>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section
        role="alert"
        className="flex flex-col gap-3 rounded-lg border border-current/20 px-5 py-4"
      >
        <p className="text-base font-semibold">
          ホームの情報を読み込めませんでした
        </p>
        <p className="text-sm opacity-70">
          インターネットにつながっているか確かめて、もう一度試してください。
        </p>
        <button
          type="button"
          onClick={retry}
          className="bg-foreground text-background rounded px-4 py-3 font-semibold"
        >
          もう一度読み込む
        </button>
      </section>
    );
  }

  const { nextClass, reviews, freeTimeSuggestions } = state.home;
  return (
    <>
      {nextClass ? <NextClassCard nextClass={nextClass} /> : <NoCourses />}
      <FreeTimeSuggestions suggestions={freeTimeSuggestions} />
      <ReviewList reviews={reviews} leaveAt={nextClass?.leaveAt} />
    </>
  );
}
