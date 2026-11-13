// front 担当のファイル。
// 次の授業カードの右上に出す残り時間。授業の前は開始まで、授業中（#61）は終了までを数える。
// 時計（use-class-clock.ts）は次の授業カードが持ち、いまの時刻を受け取る。
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
  // 数える先の時刻（開始時刻や終了時刻）
  until: string;
  // いまの時刻（ミリ秒）
  now: number;
  // 読み上げソフト向けの説明（例："開始まで"）。画面には出さない
  label: string;
  // 数字の前に小さく出す言葉（例："残り"）。無ければ数字だけ
  prefix?: string;
};

export function Countdown({ until, now, label, prefix }: Props) {
  const remaining = new Date(until).getTime() - now;
  return (
    <p className="flex items-baseline gap-1.5">
      <span className="sr-only">{label} </span>
      {prefix && (
        <span aria-hidden className="text-sm font-semibold opacity-70">
          {prefix}
        </span>
      )}
      <span className="text-2xl font-bold tabular-nums">
        {formatRemaining(remaining)}
      </span>
    </p>
  );
}
