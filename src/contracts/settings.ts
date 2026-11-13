// 共有ファイル（front と back の約束）。変更するときは front と back の両方にレビューしてもらう。
// 時間割の設定（移動の余裕時間と、時限ごとの開始・終了時刻）の形を zod で定義する。
import { z } from "zod";

// 時刻は "HH:MM"（24 時間制）
const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM 形式で入力してください");

// "HH:MM" は 0 埋めの 24 時間制なので、文字列のまま大小を比べられる
export const periodTimeSchema = z
  .object({
    period: z.number().int().min(1).max(8),
    start: timeSchema,
    end: timeSchema,
  })
  .refine(({ start, end }) => start < end, {
    message: "終了時刻は開始時刻より後にしてください",
    path: ["end"],
  });

// 時限は 1 つ以上で、同じ時限を 2 回入れない
const periodsSchema = z
  .array(periodTimeSchema)
  .min(1, "時限を 1 つ以上設定してください")
  .refine(
    (periods) =>
      new Set(periods.map(({ period }) => period)).size === periods.length,
    { message: "同じ時限が 2 つあります" },
  );

export const settingsSchema = z.object({
  travelBufferMinutes: z.number().int().min(0).max(60),
  periods: periodsSchema,
});

// 変更（PATCH）の入力。送った項目だけ変える
export const updateSettingsSchema = settingsSchema.partial();

export const settingsResponseSchema = settingsSchema;

export type PeriodTime = z.infer<typeof periodTimeSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type UpdateSettings = z.infer<typeof updateSettingsSchema>;
