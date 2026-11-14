// front 担当のファイル。
// 資料（/materials）と問題（/questions）の最初の画面に出す、科目の一覧。
// - 並び順：今日の授業の科目を先に、そのあとは曜日・時限の順。件数が 0 の科目は最後に薄く出す
// - 1 行を押すと、その科目の中（?course=<id>）へ移動する。ブラウザの戻るで、この一覧に戻れる
// - 科目の中の画面の「戻る」は BackToCourses（見出しの上のラベルに置く）
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { Course } from "@/contracts/courses";

import { DAY_LABELS, DAYS_BY_GET_DAY } from "./timetable-grid";

// 時間割から消えた科目の資料・問題を見失わないよう、まとめて 1 つの科目として扱う
export const UNKNOWN_COURSE = "unknown";
export const UNKNOWN_COURSE_NAME = "時間割に無い科目";

export type CourseEntry = {
  id: string;
  name: string;
  // 「月 2 限」のような曜日・時限（時間割に無い科目は null）
  schedule: string | null;
  today: boolean;
  // 件数の表示（例：資料 3）。empty のときは薄く出す
  detail: string;
  empty: boolean;
};

const WEEK_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// 科目を、今日の授業が先、そのあとは曜日・時限の順に並べて、件数と一緒に一覧の行にする。
// count は科目ごとの件数、format は件数の文（0 のときの文も含む）
export function buildCourseEntries(
  courses: Course[],
  now: Date,
  count: (courseId: string) => number,
  format: (n: number) => string,
  { hideEmpty }: { hideEmpty: boolean },
): CourseEntry[] {
  const todayDay = DAYS_BY_GET_DAY[now.getDay()];
  const rank = (c: Course) =>
    (c.dayOfWeek === todayDay ? 0 : 100) +
    (c.dayOfWeek === todayDay ? 0 : WEEK_ORDER.indexOf(c.dayOfWeek) * 10) +
    c.period;

  const entries: CourseEntry[] = [...courses]
    .sort((a, b) => rank(a) - rank(b))
    .map((c) => ({
      id: c.id,
      name: c.name,
      schedule: `${DAY_LABELS[c.dayOfWeek]} ${c.period} 限`,
      today: c.dayOfWeek === todayDay,
      detail: format(count(c.id)),
      empty: count(c.id) === 0,
    }));
  const unknown = count(UNKNOWN_COURSE);
  if (unknown > 0) {
    entries.push({
      id: UNKNOWN_COURSE,
      name: UNKNOWN_COURSE_NAME,
      schedule: null,
      today: false,
      detail: format(unknown),
      empty: false,
    });
  }
  // 件数がある科目を先に（並び順は保つ）
  const filled = entries.filter((e) => !e.empty);
  const empty = hideEmpty ? [] : entries.filter((e) => e.empty);
  return [...filled, ...empty];
}

export function CourseList({
  entries,
  basePath,
  ariaLabel,
}: {
  entries: CourseEntry[];
  basePath: string;
  ariaLabel: string;
}) {
  return (
    <ul aria-label={ariaLabel} className="divide-line flex flex-col divide-y">
      {entries.map((e) => (
        <li key={e.id}>
          <Link
            href={`${basePath}?course=${e.id}`}
            className="group hover:bg-surface -mx-2 flex items-center gap-3 px-2 py-3.5 transition-colors"
          >
            <span className="flex min-w-0 flex-1 flex-col">
              <span
                className={`truncate text-base ${e.empty ? "text-muted" : "font-semibold"}`}
              >
                {e.name}
              </span>
              <span className="text-muted flex items-center gap-2 text-sm">
                {e.schedule && (
                  <span className="whitespace-nowrap">{e.schedule}</span>
                )}
                {e.today && (
                  <span className="bg-accent-soft text-accent rounded-sm px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap">
                    今日
                  </span>
                )}
              </span>
            </span>
            <span
              className={`font-display text-sm whitespace-nowrap tabular-nums ${e.empty ? "text-muted" : "text-foreground"}`}
            >
              {e.detail}
            </span>
            <ChevronRight
              aria-hidden
              className="text-muted group-hover:text-foreground size-4 shrink-0 transition-colors"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

// 科目の中から、科目の一覧へ戻るリンク（Screen の label に渡す）
export function BackToCourses({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="text-muted hover:text-foreground -ml-1 inline-flex items-center gap-0.5 font-sans text-sm tracking-normal whitespace-nowrap normal-case transition-colors"
    >
      <ChevronLeft aria-hidden className="size-4" />
      科目の一覧
    </Link>
  );
}
