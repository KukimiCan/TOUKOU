// front 担当のファイル。
// 授業開始までのカウントダウン。時計（use-class-clock.ts）は次の授業カードが持ち、いまの時刻を受け取る。
// 表示は h:mm:ss。上の桁が 0 のときは省く（1:05:09 → 29:59 → 5:09 → 9）。

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
  // いまの時刻（ミリ秒）
  now: number;
};

export function Countdown({ startsAt, now }: Props) {
  const remaining = new Date(startsAt).getTime() - now;
  return (
    <p
      className="text-2xl font-bold tabular-nums"
      aria-label="開始までの残り時間"
    >
      {remaining > 0 ? formatRemaining(remaining) : "開始"}
    </p>
  );
}
