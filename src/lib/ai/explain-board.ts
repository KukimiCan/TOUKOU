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
// 解説の呼び出しが失敗したときは例外を投げる（呼び出し元が 502 を返す）。
// 数式の読み取りの呼び出しが失敗したとき、または読み取りが空のときは、照合せずに注記を残す。
export async function explainBoard(image: Uint8Array): Promise<Explanation> {
  if (isMockAi()) {
    return structuredClone(mockExplanation);
  }

  const model = getModel();
  const imagePart = { type: "file", mediaType: "image", data: image } as const;
  const [readingResult, explanationResult] = await Promise.allSettled([
    generateText({
      model,
      system: boardReadingPrompt,
      output: Output.object({ schema: boardReadingSchema }),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "この板書画像の数式を読み取ってください。" },
            imagePart,
          ],
        },
      ],
    }),
    generateText({
      model,
      system: explanationPrompt,
      output: Output.object({ schema: boardExplanationSchema }),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "この板書画像を解説してください。" },
            imagePart,
          ],
        },
      ],
    }),
  ]);

  // 解説が無ければ、結果を作れないので失敗にする
  if (explanationResult.status === "rejected") throw explanationResult.reason;
  const { output } = explanationResult.value;
  const reading =
    readingResult.status === "fulfilled" ? readingResult.value.output : null;

  const notes: string[] = [];
  let formulas = output.formulas;
  // 照合できるのは、読み取りが成功し、数式が 1 つ以上ある場合だけ
  if (reading === null) {
    notes.push("数式の読み取りに失敗したため、数式は照合していません。");
  } else if (reading.formulas.length === 0) {
    notes.push("板書の数式を読み取れなかったため、数式は照合していません。");
  } else {
    const secondKeys = new Set(
      output.formulas.map(({ formula }) => formulaKey(formula)),
    );
    const firstKeys = new Set(
      reading.formulas.map(({ formula }) => formulaKey(formula)),
    );
    notes.push(
      ...reading.formulas
        .filter(({ formula }) => !secondKeys.has(formulaKey(formula)))
        .map(
          ({ position }) => `${position}。数式の読み取りが一致しませんでした。`,
        ),
      ...output.formulas.flatMap(({ formula }, index) =>
        firstKeys.has(formulaKey(formula))
          ? []
          : [
              `解説側の数式候補 ${index + 1}。数式の読み取りが一致しませんでした。`,
            ],
      ),
    );
    formulas = output.formulas.filter(({ formula }) =>
      firstKeys.has(formulaKey(formula)),
    );
  }

  const readingUnreadable = reading?.unreadable ?? [];
  const unreadable = [
    ...new Set([
      ...[...readingUnreadable, ...output.unreadable].map(
        ({ position, reason }) =>
          `${position}。判読できませんでした（${reason}）。`,
      ),
      ...notes,
    ]),
  ];

  // 不鮮明な箇所が多い写真では、一致した式にも同じ誤読が残り得る。
  const tooManyUnclearRegions =
    reading !== null &&
    readingUnreadable.length >= 2 &&
    readingUnreadable.length >= reading.formulas.length;
  if (tooManyUnclearRegions) {
    return {
      summary:
        "数式を確実に読み取れませんでした。板書を近くから撮り直してください。",
      terms: [],
      formulas: [],
      omissions: [],
      unreadable,
    };
  }

  return { ...output, formulas, unreadable };
}
