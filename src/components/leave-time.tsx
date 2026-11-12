// front 担当のファイル。
// 次の授業カードの 3 行目「◯時◯分に移動を始めよう」（#62）。
// 移動を始める時刻（leaveAt）を過ぎたら、赤・太字・大きめの文字で急ぐよう伝える。
// 時計（use-class-clock.ts）は次の授業カードが持ち、いまの時刻を受け取る。
// ホームを開いたまま移動の時刻を過ぎたら、自動で表示が切り替わる。

// "2026-11-04T12:10:00+09:00" → "12:10"（日本時間に固定。next-class-card.tsx と同じ）
const timeFormat = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tokyo",
});

type Props = {
  leaveAt: string;
  // いまの時刻（ミリ秒）
  now: number;
};

export function LeaveTime({ leaveAt, now }: Props) {
  const leaveAtDate = new Date(leaveAt);
  const time = timeFormat.format(leaveAtDate);

  return now >= leaveAtDate.getTime() ? (
    <p className="text-center text-xl leading-tight font-bold text-red-600 dark:text-red-400">
      {time} を過ぎました。急ごう！
    </p>
  ) : (
    <p className="text-center text-sm opacity-70">{time} に移動を始めよう</p>
  );
}
