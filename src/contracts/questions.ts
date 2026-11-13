// 共有ファイル（front と back の約束）。変更するときは front と back の両方にレビューしてもらう。
// 確認問題（一覧・公開・共有・回答）の入出力の形を zod で定義する。
//
// 問題の中身（問題文、選択肢、正解、解説）の形は、AI 担当の src/lib/ai/question-schema.ts（#79）が正本。
// ここではそれを読み、ID や公開の情報だけを足している。
import { z } from "zod";

import { generatedQuestionSchema } from "@/lib/ai/question-schema";

// 問題（本人だけが見る形。正解と解説を含む）
export const questionSchema = generatedQuestionSchema.safeExtend({
  id: z.uuid(),
  materialId: z.uuid(),
  isPublic: z.boolean(),
  // 公開したときだけ入る。推測されにくい文字列（連番にしない）
  shareId: z.string().min(16).nullable(),
  createdAt: z.iso.datetime({ offset: true }),
});

// 一覧（GET /api/questions）。materialId を付けるとその資料の問題だけ
export const listQuestionsQuerySchema = z.object({
  materialId: z.uuid().optional(),
});
export const questionsResponseSchema = z.object({
  questions: z.array(questionSchema),
});

// 作成（POST /api/questions）。ID・公開情報は作るときに決める
export const createQuestionSchema = generatedQuestionSchema.safeExtend({
  materialId: z.uuid(),
});
export const questionResponseSchema = z.object({ question: questionSchema });

// 公開（POST /api/questions/[id]/publish）。公開すると共有 URL（shareId）が付く
export const publishQuestionResponseSchema = z.object({
  shareId: z.string().min(16),
  // 友達に渡す URL のパス（例: /q/<shareId>）
  sharePath: z.string().startsWith("/q/"),
});

// 共有された問題（ログイン不要の見え方）。正解と解説は回答するまで含めない
export const sharedQuestionSchema = z.object({
  shareId: z.string().min(16),
  prompt: z.string(),
  choices: generatedQuestionSchema.shape.choices,
});
export const sharedQuestionResponseSchema = z.object({
  question: sharedQuestionSchema,
});

// 回答（POST /api/shared/[shareId]/answers）。送るのは選んだ番号だけ。
// 注意：0〜5 は全体の上限。問題ごとの選択肢の数（2〜6）を超える番号は、この契約では弾けない。
// API 側で question.choices.length 未満かを確かめ、外れたら 400 を返すこと。
export const submitAnswerSchema = z.object({
  choiceIndex: z.number().int().min(0).max(5),
});

// 回答の結果。正解と解説はここで初めて返す
export const answerResultSchema = z.object({
  correct: z.boolean(),
  correctIndex: z.number().int().min(0),
  explanation: z.string(),
});
export const answerResultResponseSchema = z.object({
  result: answerResultSchema,
});

export type Question = z.infer<typeof questionSchema>;
export type CreateQuestion = z.infer<typeof createQuestionSchema>;
export type SharedQuestion = z.infer<typeof sharedQuestionSchema>;
export type SubmitAnswer = z.infer<typeof submitAnswerSchema>;
export type AnswerResult = z.infer<typeof answerResultSchema>;
export type QuestionsResponse = z.infer<typeof questionsResponseSchema>;
