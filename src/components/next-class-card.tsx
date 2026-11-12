// front 担当のファイル。
// ホームの「次の授業」カード。どこへ行けばいいか（建物・階数・教室）が一目で分かるようにする。
// - 次の授業が今日：右上に開始までのカウントダウン、下に移動開始の目安（#62）を出す
// - 次の授業が明日以降（#63）：「今日の授業はありません」を大きく出し、その下に次の授業を控えめに出す
// - 授業中（#61）：左上を「授業中」にし、右上に終了までの残り時間を出す。移動開始の目安は出さない
// - 授業が終わった後：「この授業は終わりました」と小さく出す。
//   すぐにホーム（home-content.tsx）が API を取り直し、次の授業に切り替わる（#65）
// ホームを開いたままでも、時刻に合わせて表示が自動で切り替わる。
//
// 「今日かどうか」と残り時間は端末の時刻で決めるので、ブラウザで動く部品（Client Component）にしている。
"use client";

import type { DayOfWeek } from "@/contracts/courses";
import type { NextClass } from "@/contracts/home";

import { Countdown } from "./countdown";
import { LeaveTime } from "./leave-time";
import { useClassClock } from "./use-class-clock";

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

// 日本時間の日付 → "2026-11-04"（"en-CA" は年-月-日の順で表す書式）
const dateFormat = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Tokyo",
});

// いまから見て、授業の日が何日後か（日本時間の日付で数える。今日なら 0）
function daysUntil(startsAt: string, now: number): number {
  const startDay = Date.parse(dateFormat.format(new Date(startsAt)));
  const today = Date.parse(dateFormat.format(new Date(now)));
  return Math.round((startDay - today) / 86_400_000);
}

// 明日以降の授業の、右上に出す日の目安："明日" / "木曜" / "来週の月曜"
function dayLabel(days: number, dayOfWeek: DayOfWeek): string {
  if (days === 1) return "明日";
  const day = `${DAY_LABELS[dayOfWeek]}曜`;
  return days >= 7 ? `来週の${day}` : day;
}

export function NextClassCard({ nextClass }: { nextClass: NextClass }) {
  const { course, startsAt, endsAt, leaveAt } = nextClass;
  const now = useClassClock();
  // 画面に出るまでは「今日かどうか」が分からないので、何も出さない（一瞬だけ）
  if (now === null) return null;

  const days = daysUntil(startsAt, now);
  const isToday = days <= 0;

  const place = [course.building, course.floor, course.room]
    .filter(Boolean)
    .join(" ");
  const details = (
    <>
      <InfoRow icon={<PinIcon />} label="場所" compact={!isToday}>
        {place || <span className="opacity-70">教室が登録されていません</span>}
      </InfoRow>
      <InfoRow icon={<ClockIcon />} label="時限" compact={!isToday}>
        {/* 例：水3｜12:20〜13:50 */}
        {DAY_LABELS[course.dayOfWeek]}
        {course.period}｜{timeFormat.format(new Date(startsAt))}〜
        {timeFormat.format(new Date(endsAt))}
      </InfoRow>
    </>
  );

  // 次の授業が明日以降：一言を大きく出し、次の授業は全体に小さい文字で控えめに出す
  // （移動開始の目安は、明日の時刻だと紛らわしいので出さない）
  if (!isToday) {
    return (
      <>
        <p className="text-2xl font-bold">今日の授業はありません</p>
        <section
          aria-label="次の授業"
          className="rounded-lg border border-current/20 px-5 py-4"
        >
          <div className="mb-3 flex items-center justify-between gap-3 text-sm opacity-70">
            <p className="font-semibold">次の授業</p>
            <p className="font-semibold">{dayLabel(days, course.dayOfWeek)}</p>
          </div>
          <h2 className="text-lg leading-tight font-bold">{course.name}</h2>
          <dl className="mt-2 flex flex-col gap-1">{details}</dl>
        </section>
      </>
    );
  }

  // 次の授業が今日。授業の前・授業中・終わった後で、見出しの行と 3 行目を変える
  // （授業中は、移動開始の目安の「急ごう！」より「授業中」を優先する）
  const phase =
    now < new Date(startsAt).getTime()
      ? "before"
      : now < new Date(endsAt).getTime()
        ? "inClass"
        : "ended";
  const heading = {
    before: "次の授業",
    inClass: "授業中",
    ended: "この授業は終わりました",
  }[phase];

  // 余白で情報のまとまりを表す（背景色や区切り線は使わない）
  // - 見出しの行（ラベルと残り時間）と本体の間は広く（20px）
  // - 科目名 → 場所・時限は 12px。場所と時限は同じ強さの 2 行として 6px でそろえる
  return (
    <section
      aria-label={heading}
      className="rounded-lg border border-current/20 px-5 pt-4 pb-5"
    >
      {/* 残り時間の数字が無いときも、見出しの行の高さをそろえる（min-h-8） */}
      <div className="mb-5 flex min-h-8 items-center justify-between gap-3">
        <p className="text-sm font-semibold opacity-70">{heading}</p>
        {phase === "before" && (
          <Countdown until={startsAt} now={now} label="開始まで" />
        )}
        {phase === "inClass" && (
          <Countdown until={endsAt} now={now} label="終了まで" prefix="残り" />
        )}
      </div>

      <h2 className="text-2xl leading-tight font-bold">{course.name}</h2>

      <dl className="mt-3 flex flex-col gap-1.5">{details}</dl>

      {/* 3 行目：移動開始の目安（中央揃え・アイコンなし）。授業の前だけ出す */}
      {phase === "before" && (
        <div className="mt-4">
          <LeaveTime leaveAt={leaveAt} now={now} />
        </div>
      )}
    </section>
  );
}

// アイコン + 内容の 1 行。場所と時限で同じ見た目にする
// compact のときは、文字とアイコンを小さくする（次の授業が明日以降のとき）
function InfoRow({
  icon,
  label,
  compact,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  compact: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 ${compact ? "[&_svg]:size-5" : ""}`}
    >
      <dt>
        {icon}
        <span className="sr-only">{label}</span>
      </dt>
      <dd className={`leading-tight ${compact ? "text-base" : "text-xl"}`}>
        {children}
      </dd>
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
