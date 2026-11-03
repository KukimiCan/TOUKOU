// back 担当のファイル。
// ホーム画面（GET /api/home）の中身を組み立てる。
// 時間割と設定を読み、計算関数で次の授業と移動開始時刻を求める。
// 復習（reviews）と空きコマ提案（freeTimeSuggestions）は別 issue（#9、#10）で作るので、今は空。
import type { HomeResponse } from "@/contracts/home";
import { listCourses } from "@/features/courses/course-store";
import { getSettings } from "@/features/settings/settings-store";
import { calcLeaveTime } from "@/features/timetable/leave-time";
import { findNextClass } from "@/features/timetable/next-class";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

// Date を日本時間の ISO 8601 文字列にする（例: "2026-11-04T12:20:00+09:00"）
function toJstIso(date: Date): string {
  const shifted = new Date(date.getTime() + JST_OFFSET_MS);
  return `${shifted.toISOString().slice(0, 19)}+09:00`;
}

export function getHome(userId: string, now: Date): HomeResponse {
  const courses = listCourses(userId);
  const settings = getSettings(userId);

  const next = findNextClass(now, courses, settings.periods);
  if (!next) {
    return { nextClass: null, reviews: [], freeTimeSuggestions: [] };
  }

  const leave = calcLeaveTime(now, next.startsAt, settings.travelBufferMinutes);

  return {
    nextClass: {
      course: next.course,
      startsAt: toJstIso(next.startsAt),
      endsAt: toJstIso(next.endsAt),
      minutesUntilStart: leave.minutesUntilStart,
      leaveAt: toJstIso(leave.leaveAt),
      shouldLeaveNow: leave.shouldLeaveNow,
    },
    reviews: [],
    freeTimeSuggestions: [],
  };
}
