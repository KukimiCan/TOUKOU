// front 担当のファイル。
// 次の授業カードの 3 行目「◯時◯分に移動を始めよう」（#62）。
// 移動を始める時刻（leaveAt）を過ぎたら、赤・太字・大きめの文字で急ぐよう伝える。
"use client";

import type { NextClass } from "@/contracts/home";

import { useClassClock } from "./use-class-clock";

// "2026-11-04T12:10:00+09:00" → "12:10"（日本時間に固定。next-class-card.tsx と同じ）
const timeFormat = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tokyo",
});

type Props = Pick<
  NextClass,
  "startsAt" | "minutesUntilStart" | "leaveAt" | "shouldLeaveNow"
>;

export function LeaveTime({
  startsAt,
  minutesUntilStart,
  leaveAt,
  shouldLeaveNow,
}: Props) {
  const clock = useClassClock(startsAt, minutesUntilStart);

  // 画面に出るまでは API の shouldLeaveNow を使い、出た後は端末の時刻で判定する
  // （ホームを開いたまま移動の時刻を過ぎたら、自動で表示が切り替わる）
  const leaveAtMs = new Date(leaveAt).getTime();
  const isLate =
    clock === null ? shouldLeaveNow : clock.now >= leaveAtMs + clock.shift;
  // 表示する時刻はずらさない（上の行の「12:20〜13:50」と合わせるため）
  const time = timeFormat.format(new Date(leaveAtMs));

  return isLate ? (
    <p className="text-center text-xl leading-tight font-bold text-red-600 dark:text-red-400">
      {time} を過ぎました。急ごう！
    </p>
  ) : (
    <p className="text-center text-sm opacity-70">{time} に移動を始めよう</p>
  );
}
