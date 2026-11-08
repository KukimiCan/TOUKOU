import { generateText, Output } from "ai";
import { z } from "zod";

import { getModel, isMockAi } from "./index";
import { explanationSchema, type Explanation } from "./explanation-schema";
import { mockExplanation } from "./mocks/explanation";
import { boardReadingPrompt, explanationPrompt } from "./prompts/explanation";

const unreadableRegions = z.array(
  z.object({
    position: z.string(),
    reason: z.enum(["かすれ", "見切れ", "重なり", "ぼけ", "その他"]),
  }),
);

const boardReadingSchema = z.object({
  formulas: z.array(z.object({ position: z.string(), formula: z.string() })),
  unreadable: unreadableRegions,
});

const boardExplanationSchema = explanationSchema.extend({
  unreadable: unreadableRegions,
});

function formulaKey(formula: string): string {
  // 式の内容を変えず、LaTeX の見た目だけの差を吸収する。
  return formula
    .replace(/\\(?:left|right)\b|\s/g, "")
    .replace(
      /\\(?:pmod|bmod|mod)\s*(?:\{([a-zA-Z0-9]+)\})?/g,
      (_, modulus: string | undefined) => `\\mod${modulus ?? ""}`,
    )
    .replace(/([_^])\{([a-zA-Z0-9])\}/g, "$1$2")
    .replace(/\^\{('+)}|\^(')/g, "$1$2");
}

// 画像のバイナリデータから解説を生成する。資料との紐づけ・保存は呼び出し元で行う。
export async function explainBoard(image: Uint8Array): Promise<Explanation> {
  if (isMockAi()) {
    return structuredClone(mockExplanation);
  }

  const model = getModel();
  const imagePart = { type: "file", mediaType: "image", data: image } as const;
  const [{ output: reading }, { output }] = await Promise.all([
    generateText({
      model,
      system: boardReadingPrompt,
      output: Output.object({ schema: boardReadingSchema }),
      messages: [{ role: "user", content: [imagePart] }],
    }),
    generateText({
      model,
      system: explanationPrompt,
      output: Output.object({ schema: boardExplanationSchema }),
      messages: [{ role: "user", content: [imagePart] }],
    }),
  ]);

  const secondKeys = new Set(
    output.formulas.map(({ formula }) => formulaKey(formula)),
  );
  const firstKeys = new Set(
    reading.formulas.map(({ formula }) => formulaKey(formula)),
  );
  const disputed = reading.formulas
    .filter(({ formula }) => !secondKeys.has(formulaKey(formula)))
    .map(({ position }) => `${position}。数式の読み取りが一致しませんでした。`);
  const formulas = output.formulas.filter(({ formula }) =>
    firstKeys.has(formulaKey(formula)),
  );
  const unreadable = [
    ...new Set([
      ...[...reading.unreadable, ...output.unreadable].map(
        ({ position, reason }) =>
          `${position}。判読できませんでした（${reason}）。`,
      ),
      ...disputed,
    ]),
  ];

  // 不鮮明な箇所が多い写真では、一致した式にも同じ誤読が残り得る。
  const tooManyUnclearRegions =
    reading.unreadable.length >= 2 &&
    reading.unreadable.length >= reading.formulas.length;
  const noAgreedFormulas =
    formulas.length === 0 && (firstKeys.size > 0 || secondKeys.size > 0);
  if (tooManyUnclearRegions || noAgreedFormulas) {
    return {
      summary:
        "数式を確実に読み取れませんでした。板書を近くから撮り直してください。",
      terms: [],
      formulas: [],
      omissions: [],
      unreadable:
        unreadable.length > 0
          ? unreadable
          : ["板書の数式。読み取りが一致しませんでした。"],
    };
  }

  return { ...output, formulas, unreadable };
}
