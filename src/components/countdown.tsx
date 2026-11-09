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

export function Countdown({ startsAt }: { startsAt: string }) {
  // サーバーで描画するときは時刻が分からないので、画面に出てから数え始める（それまでは null）
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  if (now === null) return null;

  const remaining = new Date(startsAt).getTime() - now;
  return (
    <p className="text-2xl font-bold tabular-nums">
      <span className="sr-only">開始まで </span>
      {remaining > 0 ? formatRemaining(remaining) : "開始"}
    </p>
  );
}
