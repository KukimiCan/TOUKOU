// back 担当のファイル。
// 今の日時・時間割・時限の時刻から「次の授業」を求める。DB を使わない計算だけの関数。
//
// 決めたこと:
// - 時刻は日本時間で扱う。サーバー（Vercel）は UTC で動くので、+9 時間ずらして計算する（日本に夏時間は無い）
// - 「次の授業」は、まだ始まっていない授業のうち一番近いもの。授業中なら、その次の授業を返す
// - 今日の授業が終わった・週末のときは、翌日以降（最大 1 週間先）から探す
// - 時限の時刻が設定されていない授業は無視する
import type { Course, DayOfWeek } from "@/contracts/courses";
import type { PeriodTime } from "@/contracts/settings";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

// Date#getUTCDay() の番号（0 = 日曜）の順
const DAYS: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export type NextClassResult = {
  course: Course;
  startsAt: Date;
  endsAt: Date;
};

// "HH:MM" を、その日の 0 時からのミリ秒にする
function timeToMs(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours * 60 + minutes) * 60 * 1000;
}

export function findNextClass(
  now: Date,
  courses: Course[],
  periods: PeriodTime[],
): NextClassResult | null {
  // 日本時間の「今日の 0 時」を UTC の時刻で表したもの
  const jstNow = now.getTime() + JST_OFFSET_MS;
  const todayStartUtc = jstNow - (jstNow % DAY_MS) - JST_OFFSET_MS;

  let best: NextClassResult | null = null;

  // 今日から 7 日後まで（来週の同じ曜日も含める）
  for (let offset = 0; offset <= 7; offset++) {
    const dayStartUtc = todayStartUtc + offset * DAY_MS;
    const day = DAYS[new Date(dayStartUtc + JST_OFFSET_MS).getUTCDay()];

    for (const course of courses) {
      if (course.dayOfWeek !== day) continue;
      const time = periods.find((p) => p.period === course.period);
      if (!time) continue;

      const startsAt = new Date(dayStartUtc + timeToMs(time.start));
      if (startsAt.getTime() <= now.getTime()) continue;
      if (best && startsAt >= best.startsAt) continue;

      const endsAt = new Date(dayStartUtc + timeToMs(time.end));
      best = { course, startsAt, endsAt };
    }

    // 近い日から探しているので、見つかった時点で終わり
    if (best) return best;
  }

  return null;
}
