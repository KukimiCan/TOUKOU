import { generateText, Output } from "ai";
import { z } from "zod";

import { getModel, isMockAi } from "./index";
import { mockQuestion } from "./mocks/question";
import { questionPrompt } from "./prompts/question";
import {
  generatedQuestionSchema,
  type GeneratedQuestion,
} from "./question-schema";

const questionOutputSchema = z.object({
  questions: z
    .array(
      generatedQuestionSchema.safeExtend({
        evidence: z
          .string()
          .trim()
          .min(1)
          .describe("正解を支える資料からの引用"),
      }),
    )
    .max(3),
});

// 資料の本文や板書の解説から確認問題を生成する。資料との紐づけは呼び出し元で行う。
export async function generateQuestions(
  sourceText: string,
): Promise<GeneratedQuestion[]> {
  const source = sourceText.trim();
  if (!source) return [];

  if (isMockAi()) return [structuredClone(mockQuestion)];

  const { output } = await generateText({
    model: getModel(),
    system: questionPrompt,
    prompt: source,
    output: Output.object({ schema: questionOutputSchema }),
  });

  return output.questions.flatMap(({ evidence, ...question }) =>
    source.includes(evidence) ? [question] : [],
  );
}
