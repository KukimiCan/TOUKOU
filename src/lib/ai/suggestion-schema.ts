import { z } from "zod";

export const freeTimeSuggestionInputSchema = z.object({
  availableMinutes: z
    .number()
    .int()
    .positive()
    .describe("移動開始までに使える空き時間（移動時間を除いた分数）"),
  reviewCourseName: z
    .string()
    .trim()
    .min(1)
    .nullable()
    .describe("復習候補の科目名。復習候補がない場合は null"),
});

export const freeTimeSuggestionOutputSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .describe("ホームに表示する短い提案文"),
});

export type FreeTimeSuggestionInput = z.infer<
  typeof freeTimeSuggestionInputSchema
>;
export type FreeTimeSuggestionOutput = z.infer<
  typeof freeTimeSuggestionOutputSchema
>;
