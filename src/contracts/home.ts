// 共有ファイル（front と back の約束）。変更するときは front と back の両方にレビューしてもらう。
// ホーム画面（GET /api/home）のレスポンスの形を zod で定義する。
import { z } from "zod";

import { courseSchema } from "./courses";

// 日時は ISO 8601 の文字列（例: "2026-11-04T10:40:00+09:00"）
const dateTimeSchema = z.iso.datetime({ offset: true });

// 次の授業。まだ始まっていない授業のうち、一番近いもの
export const nextClassSchema = z.object({
  course: courseSchema,
  startsAt: dateTimeSchema,
  endsAt: dateTimeSchema,
  // 授業が始まるまでの残り時間（分）
  minutesUntilStart: z.number().int().min(0),
  // 移動を始める時刻（開始時刻 − 移動の余裕時間）
  leaveAt: dateTimeSchema,
  // 移動を始める時刻を過ぎているとき true
  shouldLeaveNow: z.boolean(),
});

// 短い復習。前回の資料のまとめ（資料・AI の issue ができたら中身を増やす）
export const reviewItemSchema = z.object({
  materialId: z.uuid(),
  courseName: z.string(),
  summary: z.string(),
});

// 空きコマの過ごし方の提案（空きコマの issue #10 で中身を作る）
export const freeTimeSuggestionSchema = z.object({
  startsAt: dateTimeSchema,
  endsAt: dateTimeSchema,
  text: z.string(),
});

export const homeResponseSchema = z.object({
  // 登録された授業が無いときは null（週末なら翌週の授業を返す）
  nextClass: nextClassSchema.nullable(),
  reviews: z.array(reviewItemSchema),
  freeTimeSuggestions: z.array(freeTimeSuggestionSchema),
});

export type NextClass = z.infer<typeof nextClassSchema>;
export type ReviewItem = z.infer<typeof reviewItemSchema>;
export type FreeTimeSuggestion = z.infer<typeof freeTimeSuggestionSchema>;
export type HomeResponse = z.infer<typeof homeResponseSchema>;
