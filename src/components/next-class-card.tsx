// front 担当のファイル。
// ホームの「次の授業」カード。どこへ行けばいいか（建物・階数・教室）が一目で分かるようにする。
// 右上に開始までのカウントダウンを出す。授業中の表示（#61）と移動開始の目安（#62）は後から足す。
import type { DayOfWeek } from "@/contracts/courses";
import type { NextClass } from "@/contracts/home";

import { Countdown } from "./countdown";

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: "月",
  tue: "火",
  wed: "水",
  thu: "木",
  fri: "金",
  sat: "土",
  sun: "日",
};

// "2026-11-04T12:20:00+09:00" → "12:20"
// サーバー（Vercel は UTC）で表示しても日本時間になるよう、タイムゾーンを固定する
const timeFormat = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tokyo",
});

export function NextClassCard({ nextClass }: { nextClass: NextClass }) {
  const { course, startsAt, endsAt } = nextClass;
  const place = [course.building, course.floor, course.room]
    .filter(Boolean)
    .join(" ");

  // 余白で情報のまとまりを表す（背景色や区切り線は使わない）
  // - 見出しの行（ラベルと残り時間）と本体の間は広く（20px）
  // - 科目名 → 場所・時限は 12px。場所と時限は同じ強さの 2 行として 6px でそろえる
  return (
    <section
      aria-label="次の授業"
      className="rounded-lg border border-current/20 px-5 pt-4 pb-5"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold opacity-70">次の授業</p>
        <Countdown startsAt={startsAt} />
      </div>

      <h2 className="text-2xl leading-tight font-bold">{course.name}</h2>

      <dl className="mt-3 flex flex-col gap-1.5">
        <InfoRow icon={<PinIcon />} label="場所">
          {place || (
            <span className="opacity-70">教室が登録されていません</span>
          )}
        </InfoRow>
        <InfoRow icon={<ClockIcon />} label="時限">
          {/* 例：水3｜12:20〜13:50 */}
          {DAY_LABELS[course.dayOfWeek]}
          {course.period}｜{timeFormat.format(new Date(startsAt))}〜
          {timeFormat.format(new Date(endsAt))}
        </InfoRow>
      </dl>
    </section>
  );
}

// アイコン + 内容の 1 行。場所と時限で同じ見た目にする
function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <dt>
        {icon}
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="text-xl leading-tight">{children}</dd>
    </div>
  );
}

// アイコンはライブラリを増やさないよう SVG を直接書く
// 見た目の大きさがそろうよう、どちらも 24×24 の枠の上下 2〜22 くらいまで使う
const iconProps = {
  "aria-hidden": true,
  viewBox: "0 0 24 24",
  className: "size-6 shrink-0 opacity-70",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

// 場所を表す地図のピン
function PinIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 22s-8-6.6-8-12a8 8 0 0 1 16 0c0 5.4-8 12-8 12z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

// 時限を表す時計
function ClockIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
