import { z } from "zod";

/**
 * 板書解説の出力スキーマ
 * AI が板書画像から生成する解説（要約、用語、数式、省略された説明）のデータ構造
 */
export const explanationSchema = z.object({
  summary: z.string().describe("板書全体の要約・概要"),
  terms: z
    .array(
      z.object({
        term: z.string().describe("専門用語"),
        meaning: z.string().describe("用語の意味や解説"),
      }),
    )
    .describe("板書に出てくる専門用語の一覧"),
  formulas: z
    .array(
      z.object({
        formula: z.string().describe("数式や記号"),
        explanation: z.string().describe("数式が表す意味や展開の説明"),
      }),
    )
    .describe("板書に含まれる数式の解説一覧"),
  omissions: z
    .array(
      z.object({
        topic: z.string().describe("省略された箇所や前提となる概念"),
        explanation: z
          .string()
          .describe("板書で省略されている前提知識や途中式の補足説明"),
      }),
    )
    .describe("板書では省略されているが理解に必要な補足説明一覧"),
});

export type Explanation = z.infer<typeof explanationSchema>;
