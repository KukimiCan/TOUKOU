// front 担当のファイル。
// 時間割の週の表。曜日 × 時限のマスに、科目名と教室を表示する。
// - 列：基本は月〜金の 5 列。土日のどちらかに授業があれば 7 列にし、授業の無い土日の列は細くする
// - 行：基本は 1〜5 限。6 限以降は、授業がある時限まで増やす
// - 左端：時限の番号と、開始・終了の時刻
// - 科目名：マスの幅に合わせて文字を小さくし、最低 2 文字は 1 行に入るようにする
// - today を渡すと、その曜日の列の見出しを強調する（今日がどこかすぐ分かるように）
// - highlightId を渡すと、その科目のマスを少しの間だけ強調する（登録・変更できたことが分かるように）
// - onSelectEmpty を渡すと、空いたマス（細い列を除く）を押せるようになる（科目の登録 #56）
// - onSelectCourse を渡すと、科目のマスを押せるようになる（科目の変更・削除 #57）
import { Plus } from "lucide-react";

import type { Course, DayOfWeek } from "@/contracts/courses";
import type { PeriodTime } from "@/contracts/settings";

const WEEKDAYS: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri"];
const WEEKEND: DayOfWeek[] = ["sat", "sun"];
export const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: "月",
  tue: "火",
  wed: "水",
  thu: "木",
  fri: "金",
  sat: "土",
  sun: "日",
};
// Date の getDay()（0 = 日曜）の順に並べた曜日
export const DAYS_BY_GET_DAY: DayOfWeek[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];
const MIN_PERIODS = 5;

type Column = { day: DayOfWeek; narrow: boolean };

// 表に出す曜日の列を決める
function getColumns(courses: Course[]): Column[] {
  const hasClass = (day: DayOfWeek) => courses.some((c) => c.dayOfWeek === day);
  const showWeekend = WEEKEND.some(hasClass);

  const days = showWeekend ? [...WEEKDAYS, ...WEEKEND] : WEEKDAYS;
  return days.map((day) => ({
    day,
    narrow: WEEKEND.includes(day) && !hasClass(day),
  }));
}

// 表に出す時限（1 限から、5 限か授業がある最後の時限の大きいほうまで）
function getPeriods(courses: Course[]): number[] {
  const last = Math.max(MIN_PERIODS, ...courses.map((c) => c.period));
  return Array.from({ length: last }, (_, i) => i + 1);
}

type Props = {
  courses: Course[];
  periodTimes: PeriodTime[];
  // 今日の曜日（見出しを強調する）
  today?: DayOfWeek;
  // 少しの間だけ強調する科目（登録・変更した直後）
  highlightId?: string | null;
  // 空いたマスが押されたときに呼ぶ（渡さなければ、マスは押せない）
  onSelectEmpty?: (dayOfWeek: DayOfWeek, period: number) => void;
  // 科目のマスが押されたときに呼ぶ（渡さなければ、マスは押せない）
  onSelectCourse?: (course: Course) => void;
};

export function TimetableGrid({
  courses,
  periodTimes,
  today,
  highlightId,
  onSelectEmpty,
  onSelectCourse,
}: Props) {
  const columns = getColumns(courses);
  const periods = getPeriods(courses);

  // 左端の時限の列 + 曜日の列（細い列は固定幅、ほかは残りを等分）
  const gridTemplateColumns = [
    "2.75rem",
    ...columns.map((col) => (col.narrow ? "1.25rem" : "minmax(0, 1fr)")),
  ].join(" ");

  const findCourse = (day: DayOfWeek, period: number) =>
    courses.find((c) => c.dayOfWeek === day && c.period === period);

  return (
    // マスのすき間（gap-px）から罫線の色（bg-line）が見えて、細い罫線になる
    <div
      role="table"
      aria-label="週の時間割"
      className="border-line bg-line grid gap-px overflow-hidden rounded-sm border"
      style={{ gridTemplateColumns }}
    >
      {/* 見出しの行（左上は空き）。columnheader は row の中に置く決まりがある */}
      <div role="row" className="contents">
        <div role="columnheader" className="bg-background" />
        {columns.map((col) => {
          const isToday = col.day === today;
          return (
            <div
              key={col.day}
              role="columnheader"
              aria-current={isToday ? "date" : undefined}
              className={`bg-background relative py-1.5 text-center font-semibold ${
                col.narrow ? "text-muted text-xs" : "text-sm"
              } ${isToday ? "text-accent" : ""}`}
            >
              {DAY_LABELS[col.day]}
              {isToday && (
                <>
                  <span className="sr-only">（今日）</span>
                  <span
                    aria-hidden
                    className="bg-accent absolute inset-x-2 bottom-0 h-0.5"
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      {periods.map((period) => {
        const time = periodTimes.find((p) => p.period === period);
        return (
          <div key={period} role="row" className="contents">
            <div
              role="rowheader"
              className="bg-background font-display flex flex-col items-center justify-center py-1 leading-none tabular-nums"
            >
              <span className="text-base font-semibold">
                {period}
                <span className="sr-only">限</span>
              </span>
              {time && (
                <span className="text-muted mt-1 flex flex-col items-center gap-0.5 text-[0.6875rem]">
                  <span>{time.start}</span>
                  <span aria-hidden className="bg-line h-px w-2" />
                  <span className="sr-only">から</span>
                  <span>{time.end}</span>
                </span>
              )}
            </div>
            {columns.map((col) => {
              const course = col.narrow
                ? undefined
                : findCourse(col.day, period);
              return (
                <div
                  key={col.day}
                  role="cell"
                  className={`@container min-h-[4.5rem] p-1 ${
                    col.narrow ? "bg-background" : "bg-surface"
                  }`}
                >
                  {course ? (
                    <CourseCell
                      course={course}
                      highlighted={course.id === highlightId}
                      onSelect={onSelectCourse}
                    />
                  ) : (
                    onSelectEmpty &&
                    !col.narrow && (
                      <button
                        type="button"
                        aria-label={`${DAY_LABELS[col.day]}曜 ${period}限に科目を登録`}
                        onClick={() => onSelectEmpty(col.day, period)}
                        className="group text-line hover:bg-accent-soft hover:text-accent active:bg-accent-soft active:text-accent focus-visible:text-accent flex size-full items-center justify-center rounded-sm"
                      >
                        <Plus
                          aria-hidden
                          className="size-4 transition-transform duration-200 group-hover:scale-110"
                        />
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// 科目のマス。onSelect があるときはボタンにして、押すと変更のシートが開く
function CourseCell({
  course,
  highlighted,
  onSelect,
}: {
  course: Course;
  highlighted: boolean;
  onSelect?: (course: Course) => void;
}) {
  // 教室が無いときは、建物を出す
  const place = course.room ?? course.building;
  // 強調中は、琥珀で塗る（少しの間だけ。外したら、いつもの淡い色に戻る）
  const className = `flex h-full w-full flex-col gap-1 rounded-sm border-l-2 p-1 text-left leading-tight transition-colors ${
    highlighted
      ? "border-accent bg-accent text-surface"
      : "border-accent bg-accent-soft text-foreground"
  }`;
  const content = (
    <>
      {/* マスの幅（100cqi）の半分を文字の大きさの上限にして、最低 2 文字を 1 行に収める */}
      <span
        className="line-clamp-4 font-semibold [overflow-wrap:anywhere]"
        style={{ fontSize: "min(0.75rem, calc((100cqi - 0.5rem) / 2))" }}
      >
        {course.name}
      </span>
      {place && (
        <span
          className={`font-display truncate tabular-nums ${highlighted ? "" : "text-muted"}`}
          style={{ fontSize: "min(0.75rem, calc((100cqi - 0.5rem) / 2))" }}
        >
          {place}
        </span>
      )}
    </>
  );

  if (!onSelect) return <div className={className}>{content}</div>;
  return (
    <button
      type="button"
      aria-label={`${DAY_LABELS[course.dayOfWeek]}曜 ${course.period}限 ${course.name}を変更`}
      onClick={() => onSelect(course)}
      className={`${className} ${highlighted ? "" : "hover:bg-accent-soft/60"}`}
    >
      {content}
    </button>
  );
}
