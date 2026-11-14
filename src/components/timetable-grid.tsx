// front 担当のファイル。
// 時間割の週の表。曜日 × 時限のマスに、科目名と教室を表示する。
// 画面の残りの高さいっぱいに広がり、行の高さは残りの高さを時限の数で割って決める（縦にスクロールさせない）。
// - 列：月〜金。土日は、授業がある曜日だけ列を足す（土日への登録は、見出しの「追加」で曜日を選ぶ）
// - 行：getVisiblePeriods で決めた時限だけを出す（授業のある時限とその前後。全部の時限にも切り替えられる）
// - 左端：時限の番号と、開始・終了の時刻
// - today を渡すと、その曜日の列を淡く塗る（今日がどこかすぐ分かるように）
// - highlightId を渡すと、その科目のマスを少しの間だけ強調する（登録・変更できたことが分かるように）
// - onSelectEmpty を渡すと、空いたマスを押せるようになる（科目の登録 #56）
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

// 科目が無いときに出す、最後の時限（多くの大学で授業がある 1〜5 限）
const DEFAULT_LAST_PERIOD = 5;

// 表に出す曜日（月〜金 + 授業のある土日）
function getDays(courses: Course[]): DayOfWeek[] {
  const weekend = WEEKEND.filter((day) =>
    courses.some((c) => c.dayOfWeek === day),
  );
  return [...WEEKDAYS, ...weekend];
}

// 表に出す時限。授業のある最初の時限の 1 つ前から、最後の時限の 1 つ後まで（空いた時限に授業を足しやすいように）。
// 科目が無いときは 1〜5 限。all のときは、設定にある全部の時限
export function getVisiblePeriods(
  courses: Course[],
  allPeriods: number[],
  all: boolean,
): number[] {
  if (all || allPeriods.length === 0) return allPeriods;
  if (courses.length === 0) {
    return allPeriods.filter((p) => p <= DEFAULT_LAST_PERIOD);
  }
  const used = courses.map((c) => c.period);
  const from = Math.min(...used) - 1;
  const to = Math.max(...used) + 1;
  return allPeriods.filter((p) => p >= from && p <= to);
}

type Props = {
  courses: Course[];
  periodTimes: PeriodTime[];
  // 表に出す時限
  periods: number[];
  // 今日の曜日（列を淡く塗る）
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
  periods,
  today,
  highlightId,
  onSelectEmpty,
  onSelectCourse,
}: Props) {
  const days = getDays(courses);

  const findCourse = (day: DayOfWeek, period: number) =>
    courses.find((c) => c.dayOfWeek === day && c.period === period);

  return (
    // マスのすき間（gap-px）から罫線の色（bg-line）が見えて、細い罫線になる。
    // 行は、見出しの行のあとを残りの高さで等分する（最低でも押しやすい 2.75rem）。
    // 広い画面では、行が間延びしないよう高さに上限を付ける
    <div
      role="table"
      aria-label="週の時間割"
      className="border-line bg-line grid min-h-0 flex-1 gap-px overflow-hidden rounded-sm border sm:max-h-[40rem]"
      style={{
        gridTemplateColumns: `2.75rem repeat(${days.length}, minmax(0, 1fr))`,
        gridTemplateRows: `auto repeat(${periods.length}, minmax(2.75rem, 1fr))`,
      }}
    >
      {/* 見出しの行（左上は空き）。columnheader は row の中に置く決まりがある */}
      <div role="row" className="contents">
        <div role="columnheader" className="bg-background" />
        {days.map((day) => {
          const isToday = day === today;
          return (
            <div
              key={day}
              role="columnheader"
              aria-current={isToday ? "date" : undefined}
              className={`py-1 text-center text-sm font-bold ${
                isToday ? "bg-accent-soft text-accent" : "bg-background"
              }`}
            >
              {DAY_LABELS[day]}
              {isToday && <span className="sr-only">（今日）</span>}
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
              className="bg-background font-display flex flex-col items-center justify-center leading-none tabular-nums"
            >
              <span className="text-lg font-semibold">
                {period}
                <span className="sr-only">限</span>
              </span>
              {time && (
                <span className="text-muted mt-0.5 flex flex-col items-center text-[0.6875rem] leading-tight">
                  <span>{time.start}</span>
                  <span className="sr-only">から</span>
                  <span>{time.end}</span>
                </span>
              )}
            </div>
            {days.map((day) => {
              const course = findCourse(day, period);
              return (
                <div
                  key={day}
                  role="cell"
                  // 高さも測れる入れ物にして、マスの高さに合わせて科目名の行数を変える（CourseCell）
                  style={{ containerType: "size" }}
                  className={`min-h-0 p-0.5 ${
                    day === today
                      ? "bg-[color-mix(in_srgb,var(--accent-soft)_45%,var(--surface))]"
                      : "bg-surface"
                  }`}
                >
                  {course ? (
                    <CourseCell
                      course={course}
                      highlighted={course.id === highlightId}
                      onSelect={onSelectCourse}
                    />
                  ) : (
                    onSelectEmpty && (
                      <button
                        type="button"
                        aria-label={`${DAY_LABELS[day]}曜 ${period}限に科目を登録`}
                        onClick={() => onSelectEmpty(day, period)}
                        className="group text-line hover:bg-accent-soft hover:text-accent active:bg-accent-soft active:text-accent focus-visible:text-accent flex size-full min-h-0! items-center justify-center rounded-sm"
                      >
                        <Plus
                          aria-hidden
                          className="size-3.5 transition-transform duration-200 group-hover:scale-110"
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

// 科目のマス。onSelect があるときはボタンにして、押すと変更のモーダルが開く
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
  // マスの幅（100cqi）の半分を文字の大きさの目安にして、2 文字を 1 行に収める。大きさは 11px〜12px（text-xs）の範囲に収める
  const fontSize = "clamp(0.6875rem, calc((100cqi - 0.5rem) / 2), 0.75rem)";
  // 強調中は、琥珀で塗る（少しの間だけ。外したら、いつもの淡い色に戻る）
  const className = `flex size-full min-h-0! flex-col gap-0.5 overflow-hidden rounded-sm border-l-2 px-1 py-0.5 text-left leading-[1.2] transition-colors ${
    highlighted
      ? "border-accent bg-accent text-surface"
      : "border-accent bg-accent-soft text-foreground"
  }`;
  const content = (
    <>
      {/* 科目名の行数は、マスの高さで決める（途中で切れた行を見せない）。行の長さはそろえ、1 文字だけの行を作らない */}
      <span
        className="line-clamp-1 font-bold text-balance [overflow-wrap:anywhere] [word-break:auto-phrase] [@container(min-height:3.3rem)]:line-clamp-2 [@container(min-height:4.3rem)]:line-clamp-3 [@container(min-height:5.3rem)]:line-clamp-4"
        style={{ fontSize }}
      >
        {course.name}
      </span>
      {place && (
        <span
          className={`font-display hidden truncate tabular-nums [@container(min-height:2.4rem)]:block ${highlighted ? "" : "text-muted"}`}
          style={{ fontSize }}
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
      className={`${className} ${highlighted ? "" : "hover:bg-accent-soft/70"}`}
    >
      {content}
    </button>
  );
}
