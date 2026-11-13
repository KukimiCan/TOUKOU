import type {
  FreeTimeSuggestionInput,
  FreeTimeSuggestionOutput,
} from "../suggestion-schema";

export function mockFreeTimeSuggestion({
  availableMinutes,
  reviewCourseName,
}: FreeTimeSuggestionInput): FreeTimeSuggestionOutput {
  const activity =
    reviewCourseName === null
      ? "ひと息ついて、次の授業に備えよう。"
      : "次の授業の復習をひと区切り。";

  return { text: `移動まであと${availableMinutes}分。${activity}` };
}
