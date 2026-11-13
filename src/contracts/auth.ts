// 共有ファイル（front と back の約束）。変更するときは front と back の両方にレビューしてもらう。
// ログイン（POST /api/auth/login）の入出力の形を zod で定義する。
import { z } from "zod";

export const loginRequestSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
});

export const loginResponseSchema = z.object({
  ok: z.literal(true),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
