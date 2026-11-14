// front 担当のファイル。
// ホーム画面の中身（#65）。/api/home を取得し、次の授業カード・空き時間・短い復習を出す。
// 画面は端末の高さに収める（docs/design.md「画面の構成」）。
// - 主役：次の授業カード（何の授業か・どこへ・いつ動き出すか）
// - 補助：空き時間の過ごし方と短い復習は、要約を 2 行までの短い行で出し、押すとモーダルで全部を出す
// - 読み込み中：次の授業カードと要約の行の形をした骨格（HomeSkeleton）
// - ログインしていない（401）：ログインへの案内（ログイン画面は #74）
// - それ以外の失敗：何が起きたかと、次にどうするかの文、「もう一度読み込む」ボタン
// 失敗の表示は、資料や問題の画面と同じ部品（load-error.tsx）を使う。
//
// ホームを開いたままでも次の授業に進むよう、次のときに取り直す（取り直す間は今の表示を残す）。
// - 授業の終了時刻を過ぎたとき（API は「まだ終わっていない授業のうち一番近いもの」を返すので、次の授業に変わる）
// - 別のタブやアプリから戻ってきたとき（スマホでは、画面を消している間タイマーが止まることがあるため）
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { homeResponseSchema, type HomeResponse } from "@/contracts/home";

import { ApiError } from "./fetch-api";
import { FreeTimeSuggestions } from "./free-time-suggestions";
import { LoadError } from "./load-error";
import { NextClassCard } from "./next-class-card";
import { NoCourses } from "./no-courses";
import { ReviewList } from "./review-list";
import { Screen } from "./ui/screen";
import { useClassClock } from "./use-class-clock";

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

// 失敗の表示（load-error.tsx）に渡す中身
const unauthorizedError = new ApiError(401, "");
const loadError = new ApiError(
  0,
  "インターネットにつながっているか確かめて、もう一度試してください。",
);

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

  // もう一度読み込む：すぐに骨格へ切り替えて、押したことが分かるようにする
  function retry() {
    setState({ status: "loading" });
    void load();
  }

  return (
    // ナビで「ホーム」と分かるので、見出しは読み上げだけにし、日付だけを小さく出す
    <Screen label={useTodayLabel()} title="ホーム" hideTitle>
      {state.status === "loading" ? (
        <div className="flex flex-col gap-5">
          <HomeSkeleton />
        </div>
      ) : state.status === "ready" ? (
        <HomeBody home={state.home} />
      ) : (
        // 失敗の表示は、画面の上下の真ん中に置く
        <div className="flex flex-1 flex-col justify-center">
          <LoadError
            error={
              state.status === "unauthorized" ? unauthorizedError : loadError
            }
            title="ホームの情報を読み込めませんでした"
            loginMessage="ログインすると、次の授業の場所と、移動を始める時刻がここに出ます。"
            onRetry={retry}
          />
        </div>
      )}
    </Screen>
  );
}

function HomeBody({ home }: { home: HomeResponse }) {
  const { nextClass, reviews, freeTimeSuggestions } = home;
  // 表示に切り替わったときだけ、ふわっと出す（starting: = 最初に表示されたときの見た目）
  return (
    <div className="flex flex-col gap-5 transition-opacity duration-200 starting:opacity-0">
      {nextClass ? <NextClassCard nextClass={nextClass} /> : <NoCourses />}
      {/* 補助の情報。要約の行を罫線で区切って並べる（無い行は出さない） */}
      <div className="divide-line flex flex-col divide-y empty:hidden">
        <FreeTimeSuggestions suggestions={freeTimeSuggestions} />
        <ReviewList reviews={reviews} />
      </div>
    </div>
  );
}

// 画面の上の「TODAY · 11.14 SAT」。日付は端末の時刻で決めるので、画面に出てから入れる
const todayFormat = new Intl.DateTimeFormat("en-US", {
  month: "numeric",
  day: "numeric",
  weekday: "short",
  timeZone: "Asia/Tokyo",
});

function useTodayLabel(): string {
  const now = useClassClock();
  if (now === null) return "Today";
  const parts = Object.fromEntries(
    todayFormat.formatToParts(new Date(now)).map((p) => [p.type, p.value]),
  );
  return `Today · ${parts.month}.${parts.day} ${parts.weekday}`;
}

// 読み込み中の骨格。次の授業カードと要約の行の形を先に見せる
export function HomeSkeleton() {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only">ホームの情報を読み込んでいます</span>
      <div aria-hidden className="border-line bg-surface border">
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="skeleton h-4 w-16" />
          <div className="flex flex-col items-end gap-2">
            <div className="skeleton h-3 w-12" />
            <div className="skeleton h-9 w-24" />
          </div>
        </div>
        <div className="flex flex-col gap-3 px-5 pt-3 pb-5">
          <div className="skeleton h-7 w-3/4" />
          <div className="skeleton mt-1 h-5 w-1/2" />
          <div className="skeleton h-5 w-2/3" />
        </div>
        <div className="border-line flex items-center justify-between border-t px-5 py-4">
          <div className="skeleton h-4 w-28" />
          <div className="skeleton h-7 w-16" />
        </div>
      </div>
      <div aria-hidden className="flex flex-col gap-3">
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-14 w-full" />
      </div>
    </div>
  );
}
