import { generateText, Output } from "ai";

import { getModel, isMockAi } from "./index";
import { explanationSchema, type Explanation } from "./explanation-schema";
import { mockExplanation } from "./mocks/explanation";
import { explanationPrompt } from "./prompts/explanation";

// 画像のバイナリデータから解説を生成する。資料との紐づけ・保存は呼び出し元で行う。
export async function explainBoard(image: Uint8Array): Promise<Explanation> {
  if (isMockAi()) {
    return structuredClone(mockExplanation);
  }

  const { output } = await generateText({
    model: getModel(),
    system: explanationPrompt,
    output: Output.object({ schema: explanationSchema }),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "この板書画像を解説してください。" },
          { type: "file", mediaType: "image", data: image },
        ],
      },
    ],
  });

  return output;
}
