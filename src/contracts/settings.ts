// 共有ファイル（front と back の約束）。変更するときは front と back の両方にレビューしてもらう。
// 時間割の設定（移動の余裕時間と、時限ごとの開始・終了時刻）の形を zod で定義する。
import { z } from "zod";

// 時刻は "HH:MM"（24 時間制）
const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM 形式で入力してください");

export const periodTimeSchema = z.object({
  period: z.number().int().min(1).max(8),
  start: timeSchema,
  end: timeSchema,
});

export const settingsSchema = z.object({
  travelBufferMinutes: z.number().int().min(0).max(60),
  periods: z.array(periodTimeSchema),
});

// 変更（PATCH）の入力。送った項目だけ変える
export const updateSettingsSchema = settingsSchema.partial();

export const settingsResponseSchema = settingsSchema;

export type PeriodTime = z.infer<typeof periodTimeSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type UpdateSettings = z.infer<typeof updateSettingsSchema>;
