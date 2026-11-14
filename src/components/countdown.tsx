// front 担当のファイル。
// 次の授業カードの右上に出す残り時間。授業の前は開始まで、授業中（#61）は終了までを数える。
// 時計（use-class-clock.ts）は次の授業カードが持ち、いまの時刻を受け取る。
// 表示は h:mm:ss。時間が 0 のときは m:ss（1:05:09 → 29:59 → 5:09 → 0:09）。
// 数字は英字の書体（font-display）で大きく、桁の幅をそろえて（tabular-nums）毎秒の揺れを防ぐ。

// 残りミリ秒 → "1:05:09" / "29:59" / "5:09" / "0:09"
export function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");

  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

type Props = {
  // 数える先の時刻（開始時刻や終了時刻）
  until: string;
  // いまの時刻（ミリ秒）
  now: number;
  // 数字の上に小さく出す説明（例："開始まで"）
  label: string;
};

export function Countdown({ until, now, label }: Props) {
  const remaining = new Date(until).getTime() - now;
  return (
    <p className="flex flex-col items-end">
      <span className="text-muted text-xs font-semibold whitespace-nowrap">
        {label}
      </span>
      <span className="font-display text-4xl leading-none font-semibold tracking-wide tabular-nums">
        {formatRemaining(remaining)}
      </span>
    </p>
  );
}
