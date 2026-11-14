// front 担当のファイル。
// 次の授業カードの下の帯「移動を始める目安 12:10（あと 8 分）」（#62）。
// 移動を始める時刻（leaveAt）を過ぎたら、帯を失敗の色（text-danger）に変え、太字で急ぐよう伝える。
// 時計（use-class-clock.ts）は次の授業カードが持ち、いまの時刻を受け取る。
// ホームを開いたまま移動の時刻を過ぎたら、自動で表示が切り替わる。
import { Footprints, TriangleAlert } from "lucide-react";

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
  const leaveAtMs = new Date(leaveAt).getTime();
  const time = timeFormat.format(new Date(leaveAt));
  const isLate = now >= leaveAtMs;
  // 移動を始めるまでの分（切り上げ）
  const minutesLeft = Math.ceil((leaveAtMs - now) / 60_000);

  return (
    <div className="border-line border-t">
      {isLate ? (
        // 切り替わったときに、読み上げソフトにも伝える（role="alert"）
        <p
          role="alert"
          className="bg-danger/10 text-danger flex items-center justify-between gap-3 px-5 py-4"
        >
          <span className="flex items-center gap-2 text-lg font-bold whitespace-nowrap">
            <TriangleAlert aria-hidden className="size-5 shrink-0" />
            急ごう！
          </span>
          <span className="text-sm font-semibold whitespace-nowrap">
            <span className="font-display text-base tracking-wide tabular-nums">
              {time}
            </span>{" "}
            を過ぎました
          </span>
        </p>
      ) : (
        <p className="flex items-center justify-between gap-3 px-5 py-4">
          <span className="text-muted flex items-center gap-2 text-sm whitespace-nowrap">
            <Footprints aria-hidden className="size-4 shrink-0" />
            移動を始める目安
          </span>
          <span className="flex items-baseline gap-2 whitespace-nowrap">
            <span className="font-display text-2xl leading-none font-semibold tracking-wide tabular-nums">
              {time}
            </span>
            <span className="text-muted text-sm">
              {minutesLeft <= 1 ? (
                "まもなく"
              ) : (
                <>
                  あと
                  <span className="font-display tabular-nums">
                    {" "}
                    {minutesLeft}{" "}
                  </span>
                  分
                </>
              )}
            </span>
          </span>
        </p>
      )}
    </div>
  );
}
