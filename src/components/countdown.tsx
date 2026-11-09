// front 担当のファイル。
// 授業開始までのカウントダウン（1 秒ごとに更新）。端末の時刻で数える。
// 表示は h:mm:ss。上の桁が 0 のときは省く（1:05:09 → 29:59 → 5:09 → 9）。
"use client";

import { useClassClock } from "./use-class-clock";

// 残りミリ秒 → "1:05:09" / "29:59" / "5:09" / "9"
export function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  if (m > 0) return `${m}:${pad(s)}`;
  return String(s);
}

type Props = {
  startsAt: string;
  minutesUntilStart: number;
};

export function Countdown({ startsAt, minutesUntilStart }: Props) {
  // 画面に出るまでは null（何も表示しない）
  const clock = useClassClock(startsAt, minutesUntilStart);
  if (clock === null) return null;

  const deadline = new Date(startsAt).getTime() + clock.shift;
  const remaining = deadline - clock.now;
  return (
    <p
      className="text-2xl font-bold tabular-nums"
      aria-label="開始までの残り時間"
    >
      {remaining > 0 ? formatRemaining(remaining) : "開始"}
    </p>
  );
}
