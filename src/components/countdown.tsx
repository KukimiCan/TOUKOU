// front 担当のファイル。
// 授業開始までのカウントダウン（1 秒ごとに更新）。端末の時刻で数える。
// 表示は h:mm:ss。上の桁が 0 のときは省く（1:05:09 → 29:59 → 5:09 → 9）。
"use client";

import { useEffect, useState } from "react";

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
  // サーバーで描画するときは時刻が分からないので、画面に出てから数え始める（それまでは null）
  const [clock, setClock] = useState<{ deadline: number; now: number } | null>(
    null,
  );

  useEffect(() => {
    // 数え終わる時刻。仮データのように開始時刻が過去なのに残り時間がある場合は、残り時間（分）から数える
    const getDeadline = (now: number) => {
      const start = new Date(startsAt).getTime();
      return start <= now && minutesUntilStart > 0
        ? now + minutesUntilStart * 60_000
        : start;
    };
    let deadline: number | null = null;
    const tick = () => {
      const now = Date.now();
      deadline ??= getDeadline(now);
      setClock({ deadline, now });
    };

    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [startsAt, minutesUntilStart]);

  if (clock === null) return null;

  const remaining = clock.deadline - clock.now;
  return (
    <p
      className="text-2xl font-bold tabular-nums"
      aria-label="開始までの残り時間"
    >
      {remaining > 0 ? formatRemaining(remaining) : "開始"}
    </p>
  );
}
