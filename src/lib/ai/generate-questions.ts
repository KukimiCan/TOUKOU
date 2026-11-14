import { generateText, Output } from "ai";
import { z } from "zod";

import { getModel, isMockAi } from "./index";
import { mockQuestion } from "./mocks/question";
import { questionPrompt } from "./prompts/question";
import { assertSafeStudyOutput } from "./study-output-safety";
import {
  generatedQuestionSchema,
  type GeneratedQuestion,
} from "./question-schema";

const questionOutputSchema = z.object({
  questions: z
    .array(
      z.object({
        prompt: z.string(),
        choices: z.array(z.string()),
        answerIndex: z.number(),
        explanation: z.string(),
        evidence: z.string().describe("正解を支える資料からの引用"),
      }),
    )
    .max(3),
});

function normalizeCitation(text: string): string {
  return text.normalize("NFKC").replace(/\s+/g, "");
}

// 資料の本文や板書の解説から確認問題を生成する。資料との紐づけは呼び出し元で行う。
export async function generateQuestions(
  sourceText: string,
): Promise<GeneratedQuestion[]> {
  const source = sourceText.trim();
  if (!source) return [];

  if (isMockAi()) return [structuredClone(mockQuestion)];

  // 呼び出し元が AI の解説を渡す場合もあるため、次のモデル呼び出し前に検査する。
  assertSafeStudyOutput(source);

  const { output } = await generateText({
    model: getModel(),
    system: questionPrompt,
    prompt: source,
    maxOutputTokens: 8192,
    output: Output.object({ schema: questionOutputSchema }),
  });

  // 解説から問題へ、画像内の命令を引き継がない。
  assertSafeStudyOutput(output);

  const normalizedSource = normalizeCitation(source);
  return output.questions.flatMap(({ evidence, ...question }) => {
    const citation = normalizeCitation(evidence);
    if (!citation || !normalizedSource.includes(citation)) return [];

    const parsed = generatedQuestionSchema.safeParse(question);
    return parsed.success ? [parsed.data] : [];
  });
}
