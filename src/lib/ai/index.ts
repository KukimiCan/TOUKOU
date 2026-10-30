// AI 担当のファイル。
// どの AI（OpenAI / Google Gemini / mock）を使うかを環境変数で切り替える。
// 生成する関数（解説、要約、確認問題など）はこのフォルダに 1 機能 1 ファイルで追加する。
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

export type AiProvider = "openai" | "google" | "mock";

export function getAiProvider(): AiProvider {
  // 空欄（AI_PROVIDER=）も未設定と同じく mock として扱う。
  const provider = process.env.AI_PROVIDER?.trim() || "mock";
  if (provider === "openai" || provider === "google" || provider === "mock") {
    return provider;
  }
  throw new Error(
    `AI_PROVIDER の値が不正です: "${provider}"。openai / google / mock のどれかにしてください。`,
  );
}

// mock のときは AI を呼ばずに仮の結果を返す。キーが無くても開発を進められるようにするため。
export function isMockAi() {
  return getAiProvider() === "mock";
}

// AI SDK（https://ai-sdk.dev）の generateText などに渡すモデルを返す。
// mock のときは呼ばないこと（先に isMockAi() で分岐する）。
export function getModel() {
  const provider = getAiProvider();
  const modelId = process.env.AI_MODEL;

  if (provider === "mock") {
    throw new Error(
      "AI_PROVIDER=mock では getModel() を使えません。isMockAi() で分岐してください。",
    );
  }
  if (!modelId) {
    throw new Error("AI_MODEL が設定されていません（.env.local）。");
  }

  if (provider === "openai") {
    return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })(modelId);
  }
  return createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  })(modelId);
}

// キーの値は返さず、設定されているかどうかだけを返す（health API 用）。
export function hasAiKey() {
  const provider = getAiProvider();
  if (provider === "mock") return true;
  if (provider === "openai") return Boolean(process.env.OPENAI_API_KEY);
  return Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
}
