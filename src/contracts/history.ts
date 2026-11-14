// 共有ファイル（front と back の約束）。変更するときは front と back の両方にレビューしてもらう。
// ログイン中のユーザーが解いた共有問題の履歴（GET /api/answers/history）の形を zod で定義する。
// 新しい順に最大 100 件。あとで問題が非公開になったものは含まれない。
import { z } from "zod";

export const answerHistoryItemSchema = z.object({
  // 問題の共有 ID（/q/<shareId> で開ける）
  shareId: z.string().min(16),
  prompt: z.string(),
  // 正解だったか
  correct: z.boolean(),
  answeredAt: z.iso.datetime({ offset: true }),
});
export type AnswerHistoryItem = z.infer<typeof answerHistoryItemSchema>;

export const answerHistoryResponseSchema = z.object({
  items: z.array(answerHistoryItemSchema),
});
