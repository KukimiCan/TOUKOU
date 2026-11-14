import { generateText, Output } from "ai";

import { formatDuration } from "../format-duration";
import { getModel, isMockAi } from "./index";
import { mockFreeTimeSuggestion } from "./mocks/suggestion";
import { suggestionPrompt } from "./prompts/suggestion";
import {
  freeTimeSuggestionInputSchema,
  freeTimeSuggestionOutputSchema,
  type FreeTimeSuggestionInput,
  type FreeTimeSuggestionOutput,
} from "./suggestion-schema";

const timingInstructions =
  /[\p{N}\r\n]|移動|出発|遅刻|時間|時刻|分間|秒|[一二三四五六七八九十数半]+分|ギリギリ|ぎりぎり/u;

export async function generateFreeTimeSuggestion(
  input: FreeTimeSuggestionInput,
): Promise<FreeTimeSuggestionOutput> {
  const suggestion = freeTimeSuggestionInputSchema.parse(input);
  const fallback = mockFreeTimeSuggestion(suggestion);
  if (isMockAi()) return fallback;

  const { availableMinutes, reviewCourseName } = suggestion;
  try {
    const { output } = await generateText({
      model: getModel(),
      system: suggestionPrompt,
      // 科目名を外部に送らず、復習候補の有無だけを使う。
      prompt: JSON.stringify({
        availableMinutes,
        hasReview: reviewCourseName !== null,
      }),
      output: Output.object({ schema: freeTimeSuggestionOutputSchema }),
      abortSignal: AbortSignal.timeout(8000),
      maxRetries: 0,
    });

    if (timingInstructions.test(output.text.normalize("NFKC"))) return fallback;
    const result = freeTimeSuggestionOutputSchema.safeParse({
      text: `移動まであと${formatDuration(availableMinutes)}。${output.text}`,
    });
    return result.success ? result.data : fallback;
  } catch {
    // AI の応答が得られなくても、ホームに提案文を返せるようにする。
    return fallback;
  }
}
