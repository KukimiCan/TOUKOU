// 共有ファイル（front と back の約束）。変更するときは front と back の両方にレビューしてもらう。
// 各ユーザーが登録する AI のキー（#220）の形を zod で定義する。
// キーそのものは画面へ返さない。返すのは「登録済みか」と末尾 4 文字（hint）だけ。
import { z } from "zod";

// GET /api/settings/ai-key の応答
export const aiKeyStatusSchema = z.object({
  // 今アプリが使っている AI。mock のときはキーが要らない
  provider: z.enum(["openai", "google", "mock"]),
  // キーの登録が必要か（mock のときは false）
  required: z.boolean(),
  registered: z.boolean(),
  // 登録したキーの末尾 4 文字（どのキーを入れたか見分けるため）
  hint: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

// POST /api/settings/ai-key の入力。前後の空白は取り除く（コピーで入りやすいため）
export const saveAiKeySchema = z.object({
  apiKey: z
    .string()
    .trim()
    .min(20, "キーが短すぎます。全部コピーできているか確かめてください")
    .max(300, "キーが長すぎます")
    .regex(/^[\x21-\x7e]+$/, "キーに使えない文字が入っています"),
});

export type AiKeyStatus = z.infer<typeof aiKeyStatusSchema>;
export type SaveAiKey = z.infer<typeof saveAiKeySchema>;
