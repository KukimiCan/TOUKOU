import { z } from "zod";

// AI が生成する確認問題1問の内容。資料との紐づけや公開情報は呼び出し元が管理する。
export const generatedQuestionSchema = z
  .object({
    prompt: z.string().trim().min(1).max(500).describe("確認問題の問題文"),
    choices: z
      .array(z.string().trim().min(1).max(200))
      .min(2)
      .max(6)
      .describe("回答の選択肢。正解は1つ"),
    answerIndex: z
      .number()
      .int()
      .min(0)
      .describe("正解の選択肢の番号。先頭は0"),
    explanation: z
      .string()
      .trim()
      .min(1)
      .max(1000)
      .describe("正解の理由を説明する文章"),
  })
  .refine(({ answerIndex, choices }) => answerIndex < choices.length, {
    message: "正解の番号は選択肢の範囲内にしてください",
    path: ["answerIndex"],
  });

export type GeneratedQuestion = z.infer<typeof generatedQuestionSchema>;
