// 仮データ（架空）。形は src/contracts/home.ts に合わせる。
// 「水曜 11:50 に開いた」想定。次の授業は 3 限（12:20 開始）、移動の余裕時間は 10 分。
import type { HomeResponse } from "@/contracts/home";

import { mockCourses } from "./courses";

export const mockHomeResponse: HomeResponse = {
  nextClass: {
    course: mockCourses[1],
    startsAt: "2026-11-04T12:20:00+09:00",
    endsAt: "2026-11-04T13:50:00+09:00",
    minutesUntilStart: 30,
    leaveAt: "2026-11-04T12:10:00+09:00",
    shouldLeaveNow: false,
  },
  reviews: [
    {
      materialId: "00000000-0000-4000-8000-000000000101",
      courseName: "プログラミング基礎（仮）",
      summary: "前回は for 文と配列を使った合計の求め方を学んだ。",
    },
  ],
  freeTimeSuggestions: [
    {
      startsAt: "2026-11-04T11:50:00+09:00",
      endsAt: "2026-11-04T12:10:00+09:00",
      text: "移動まで 20 分。前回の確認問題を 3 問解いておこう。",
    },
  ],
};

// 登録された授業が無いとき
export const mockHomeResponseNoClass: HomeResponse = {
  nextClass: null,
  reviews: [],
  freeTimeSuggestions: [],
};

// 今日の授業がもう無いとき（#63）
// 「日曜 20:00 に開いた」想定。次の授業は明日（月曜）の 1 限（9:00 開始）、移動の余裕時間は 10 分。
export const mockHomeResponseTomorrow: HomeResponse = {
  nextClass: {
    course: mockCourses[0],
    startsAt: "2026-11-09T09:00:00+09:00",
    endsAt: "2026-11-09T10:30:00+09:00",
    minutesUntilStart: 780,
    leaveAt: "2026-11-09T08:50:00+09:00",
    shouldLeaveNow: false,
  },
  reviews: [],
  freeTimeSuggestions: [],
};
