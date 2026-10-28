// 共有ファイル（front と back の約束）。変更するときは front と back の両方にレビューしてもらう。
// API の入出力の形を zod で定義する。front も back もこの型を使うので、形のずれが起きない。
import { z } from "zod";

export const healthResponseSchema = z.object({
  ok: z.boolean(),
  supabase: z.object({
    configured: z.boolean(),
    reachable: z.boolean(),
  }),
  ai: z.object({
    provider: z.enum(["openai", "google", "mock"]),
    configured: z.boolean(),
  }),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
