// front 担当のファイル。
// ホームの「次の授業」カード。ホームの主役。
// 何の授業か・どこへ行くか（建物・階数・教室）・あと何分か・いつ動き出すかが一目で分かるようにする。
// - 次の授業が今日：右上に開始までのカウントダウン、下の帯に移動開始の目安（#62）を出す
// - 次の授業が明日以降（#63）：1 枚のカードの上の行に「今日の授業はありません」と次の授業の日を出し、次の授業を控えめに出す
// - 授業中（#61）：左上を「授業中」にし、右上に終了までの残り時間、下の端に授業の進み具合の線を出す
// - 授業が終わった後：「この授業は終わりました」と、次の授業を確かめている印を出す。
//   すぐにホーム（home-content.tsx）が API を取り直し、次の授業に切り替わる（#65）
// ホームを開いたままでも、時刻に合わせて表示が自動で切り替わる。
//
// 「今日かどうか」と残り時間は端末の時刻で決めるので、ブラウザで動く部品（Client Component）にしている。
"use client";

import { CalendarCheck, Clock, MapPin } from "lucide-react";

import type { DayOfWeek } from "@/contracts/courses";
import type { NextClass } from "@/contracts/home";

import { Countdown } from "./countdown";
import { LeaveTime } from "./leave-time";
import { Spinner } from "./ui/spinner";
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
  // 画面に出るまでは「今日かどうか」が分からないので、同じ大きさの骨格を出す（一瞬だけ）
  if (now === null) {
    return <div aria-hidden className="skeleton h-64 w-full" />;
  }

  const days = daysUntil(startsAt, now);
  const isToday = days <= 0;
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();

  const place = [course.building, course.floor, course.room]
    .filter(Boolean)
    .join(" ");
  const details = (
    <>
      <InfoRow icon={<MapPin aria-hidden />} label="場所" compact={!isToday}>
        {place ? (
          <span className="font-semibold">{place}</span>
        ) : (
          <span className="text-muted">教室が登録されていません</span>
        )}
      </InfoRow>
      <InfoRow icon={<Clock aria-hidden />} label="時限" compact={!isToday}>
        {/* 例：3限　12:20–13:50（今日の授業なら曜日は要らない。明日以降は右上に日を出す） */}
        <span className="flex flex-wrap items-baseline gap-x-3">
          <span className="whitespace-nowrap">
            <span className="font-display text-[1.15em] tabular-nums">
              {course.period}
            </span>
            限
          </span>
          <span className="font-display text-[1.15em] tracking-wide whitespace-nowrap tabular-nums">
            {timeFormat.format(new Date(startsAt))}–
            {timeFormat.format(new Date(endsAt))}
          </span>
        </span>
      </InfoRow>
    </>
  );

  // 次の授業が明日以降：カードの上の行で「今日の授業はありません」と、次の授業の日を伝え、
  // 次の授業は今日のときより小さい文字で控えめに出す
  // （移動開始の目安は、明日の時刻だと紛らわしいので出さない）
  if (!isToday) {
    return (
      <section
        aria-labelledby="next-class-title"
        className="border-line bg-surface border px-5 pt-4 pb-5"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-semibold whitespace-nowrap">
            <CalendarCheck
              aria-hidden
              className="text-accent size-4 shrink-0"
            />
            今日の授業はありません
          </p>
          <p className="text-muted text-sm whitespace-nowrap">
            次は
            <span className="bg-accent-soft text-accent ml-1.5 rounded-sm px-2 py-0.5 font-semibold">
              {dayLabel(days, course.dayOfWeek)}
            </span>
          </p>
        </div>
        <h2
          id="next-class-title"
          className="text-xl leading-snug font-bold [word-break:auto-phrase]"
        >
          {course.name}
        </h2>
        <dl className="mt-3 flex flex-col gap-1.5">{details}</dl>
      </section>
    );
  }

  // 次の授業が今日。授業の前・授業中・終わった後で、見出しの行と下の帯を変える
  // （授業中は、移動開始の目安の「急ごう！」より「授業中」を優先する）
  const phase = now < start ? "before" : now < end ? "inClass" : "ended";
  const heading = {
    before: "次の授業",
    inClass: "授業中",
    ended: "この授業は終わりました",
  }[phase];
  // 授業の進み具合（0〜100）。授業中だけ使う
  const progress = Math.min(
    100,
    Math.max(0, ((now - start) / (end - start)) * 100),
  );

  return (
    <section
      aria-labelledby="next-class-title"
      className="border-line bg-surface border"
    >
      {/* 見出しの行：左に状態、右に残り時間。残り時間が無いときも高さをそろえる */}
      <div className="flex min-h-16 items-start justify-between gap-4 px-5 pt-5">
        <p
          className={`flex items-center gap-2 text-sm font-semibold whitespace-nowrap ${
            phase === "inClass" ? "text-accent" : "text-muted"
          }`}
        >
          <span
            aria-hidden
            className={`size-2 shrink-0 rounded-full ${
              phase === "ended" ? "bg-line" : "bg-accent"
            } ${phase === "inClass" ? "animate-pulse" : ""}`}
          />
          {heading}
        </p>
        {phase === "before" && (
          <Countdown until={startsAt} now={now} label="開始まで" />
        )}
        {phase === "inClass" && (
          <Countdown until={endsAt} now={now} label="終了まで" />
        )}
      </div>

      <div className="px-5 pt-2 pb-5">
        <h2
          id="next-class-title"
          className="text-2xl leading-snug font-bold [word-break:auto-phrase]"
        >
          {course.name}
        </h2>
        <dl className="mt-4 flex flex-col gap-2">{details}</dl>
      </div>

      {/* 下の帯：授業の前は移動開始の目安、終わった後は次の授業を確かめている印 */}
      {phase === "before" && <LeaveTime leaveAt={leaveAt} now={now} />}
      {phase === "ended" && (
        <p
          role="status"
          className="border-line text-muted flex items-center gap-2 border-t px-5 py-4 text-sm"
        >
          <Spinner />
          次の授業を確かめています
        </p>
      )}

      {/* 授業中：カードの下の端に、授業の進み具合を細い線で出す（数字は右上の残り時間で伝える） */}
      {phase === "inClass" && (
        <div aria-hidden className="bg-line h-1">
          <div
            className="bg-accent h-full transition-[width] duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
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
      className={`[&_svg]:text-muted flex items-start gap-2.5 [&_svg]:shrink-0 ${
        compact
          ? "[&_svg]:mt-0.5 [&_svg]:size-4"
          : "[&_svg]:mt-1 [&_svg]:size-5"
      }`}
    >
      <dt>
        {icon}
        <span className="sr-only">{label}</span>
      </dt>
      <dd
        className={`leading-snug [word-break:auto-phrase] ${
          compact ? "text-base" : "text-lg"
        }`}
      >
        {children}
      </dd>
    </div>
  );
}
