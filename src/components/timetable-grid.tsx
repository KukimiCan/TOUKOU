// front 担当のファイル。
// 時間割の週の表。曜日 × 時限のマスに、科目名と教室を表示する。
// - 列：基本は月〜金の 5 列。土日のどちらかに授業があれば 7 列にし、授業の無い土日の列は細くする
// - 行：基本は 1〜5 限。6 限以降は、授業がある時限まで増やす
// - 科目名：マスの幅に合わせて文字を小さくし、最低 2 文字は 1 行に入るようにする
// - onSelectEmpty を渡すと、空いたマス（細い列を除く）を押せるようになる（科目の登録 #56）
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
  // 空いたマスが押されたときに呼ぶ（渡さなければ、マスは押せない）
  onSelectEmpty?: (dayOfWeek: DayOfWeek, period: number) => void;
};

export function TimetableGrid({ courses, periodTimes, onSelectEmpty }: Props) {
  const columns = getColumns(courses);
  const periods = getPeriods(courses);

  // 左端の時限の列 + 曜日の列（細い列は固定幅、ほかは残りを等分）
  const gridTemplateColumns = [
    "2.5rem",
    ...columns.map((col) => (col.narrow ? "1.25rem" : "minmax(0, 1fr)")),
  ].join(" ");

  const findCourse = (day: DayOfWeek, period: number) =>
    courses.find((c) => c.dayOfWeek === day && c.period === period);

  return (
    <div
      role="table"
      aria-label="週の時間割"
      className="grid gap-px overflow-hidden rounded border border-current/20 bg-current/20"
      style={{ gridTemplateColumns }}
    >
      {/* 見出しの行（左上は空き）。columnheader は row の中に置く決まりがある */}
      <div role="row" className="contents">
        <div role="columnheader" className="bg-background" />
        {columns.map((col) => (
          <div
            key={col.day}
            role="columnheader"
            className={`bg-background py-1 text-center font-semibold ${col.narrow ? "text-xs opacity-50" : "text-sm"}`}
          >
            {DAY_LABELS[col.day]}
          </div>
        ))}
      </div>

      {periods.map((period) => {
        const start = periodTimes.find((p) => p.period === period)?.start;
        return (
          <div key={period} role="row" className="contents">
            <div
              role="rowheader"
              className="bg-background flex flex-col items-center justify-center py-1"
            >
              <span className="text-sm font-semibold">{period}</span>
              {start && (
                <span className="text-[0.625rem] opacity-60">{start}</span>
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
                  className="bg-background @container min-h-16 p-1"
                >
                  {course ? (
                    <CourseCell course={course} />
                  ) : (
                    onSelectEmpty &&
                    !col.narrow && (
                      <button
                        type="button"
                        aria-label={`${DAY_LABELS[col.day]}曜 ${period}限に科目を登録`}
                        onClick={() => onSelectEmpty(col.day, period)}
                        className="size-full rounded-sm hover:bg-current/5 active:bg-current/10"
                      />
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

function CourseCell({ course }: { course: Course }) {
  return (
    <div className="flex h-full flex-col gap-0.5 rounded-sm bg-current/10 p-0.5 leading-tight">
      {/* マスの幅（100cqi）の半分を文字の大きさの上限にして、最低 2 文字を 1 行に収める */}
      <span
        className="line-clamp-3 font-semibold [overflow-wrap:anywhere]"
        style={{ fontSize: "min(0.8125rem, calc((100cqi - 0.25rem) / 2))" }}
      >
        {course.name}
      </span>
      {course.room && (
        <span
          className="truncate opacity-70"
          style={{ fontSize: "min(0.625rem, calc((100cqi - 0.25rem) / 2))" }}
        >
          {course.room}
        </span>
      )}
    </div>
  );
}
