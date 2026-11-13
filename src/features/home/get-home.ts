// back 担当のファイル。
// ホーム画面（GET /api/home）の中身を組み立てる。
// 時間割と設定を読み、計算関数で次の授業・移動開始時刻・空き時間・復習候補を求める。
//
// 空きコマの文面は、今は計算で作る（AI の関数 #82・#83 ができたら差し替える）。
// 資料の保存先（#45）ができるまで、資料は空の配列を渡す。そのため reviews は今は空。
import type { FreeTimeSuggestion, HomeResponse } from "@/contracts/home";
import { listCourses } from "@/features/courses/course-store";
import { getSettings } from "@/features/settings/settings-store";
import { calcFreeTime } from "@/features/timetable/free-time";
import { calcLeaveTime } from "@/features/timetable/leave-time";
import { findNextClass } from "@/features/timetable/next-class";
import {
  pickReviewMaterial,
  type ReviewSource,
} from "@/features/timetable/review-pick";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// Date を日本時間の ISO 8601 文字列にする（例: "2026-11-04T12:20:00+09:00"）
function toJstIso(date: Date): string {
  const shifted = new Date(date.getTime() + JST_OFFSET_MS);
  return `${shifted.toISOString().slice(0, 19)}+09:00`;
}

// 空き時間に出す文面（計算で作る）。資料があれば復習、無ければ休憩を勧める
function suggestionText(minutes: number, hasReview: boolean): string {
  return hasReview
    ? `${minutes} 分の空き。次の授業の科目を復習しよう。`
    : `${minutes} 分の空き。休憩しよう。`;
}

export async function getHome(
  userId: string,
  now: Date,
  materials: ReviewSource[] = [],
): Promise<HomeResponse> {
  const courses = await listCourses(userId);
  const settings = await getSettings(userId);

  const next = findNextClass(now, courses, settings.periods);
  if (!next) {
    return { nextClass: null, reviews: [], freeTimeSuggestions: [] };
  }

  const leave = calcLeaveTime(now, next.startsAt, settings.travelBufferMinutes);

  // 移動の時間を残すため、空き時間は移動開始時刻までにする
  const free = calcFreeTime(now, leave.leaveAt);
  const review = pickReviewMaterial(next.course.id, materials);

  const freeTimeSuggestions: FreeTimeSuggestion[] = free
    ? [
        {
          startsAt: toJstIso(free.startsAt),
          endsAt: toJstIso(free.endsAt),
          text: suggestionText(free.minutes, review !== null),
        },
      ]
    : [];

  return {
    nextClass: {
      course: next.course,
      startsAt: toJstIso(next.startsAt),
      endsAt: toJstIso(next.endsAt),
      minutesUntilStart: leave.minutesUntilStart,
      leaveAt: toJstIso(leave.leaveAt),
      shouldLeaveNow: leave.shouldLeaveNow,
    },
    // 資料の要約は AI の結果が要る（#45・#47）ので、まだ作らない
    reviews: [],
    freeTimeSuggestions,
  };
}
