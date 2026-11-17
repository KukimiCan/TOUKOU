// AI 担当のファイル。
// どの AI（OpenAI / Google Gemini / mock）を使うかを環境変数で切り替える。
// AI のキーは共有せず、各ユーザーが自分のキーを登録する（#220）。呼び出す側が、その人のキーを渡す。
// 生成する関数（解説、要約、確認問題など）はこのフォルダに 1 機能 1 ファイルで追加する。
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

export type AiProvider = "openai" | "google" | "mock";

export function getAiProvider(): AiProvider {
  const provider = process.env.AI_PROVIDER ?? "mock";
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

// 使うモデル名。mock のときは呼ばないこと
export function getModelId() {
  const modelId = process.env.AI_MODEL;
  if (!modelId) {
    throw new Error("AI_MODEL が設定されていません（.env.local）。");
  }
  return modelId;
}

// AI SDK（https://ai-sdk.dev）の generateText などに渡すモデルを返す。
// apiKey は、そのユーザーが登録したキー（src/features/ai-keys/）。
// mock のときは呼ばないこと（先に isMockAi() で分岐する）。
export function getModel(apiKey: string) {
  const provider = getAiProvider();
  if (provider === "mock") {
    throw new Error(
      "AI_PROVIDER=mock では getModel() を使えません。isMockAi() で分岐してください。",
    );
  }

  const modelId = getModelId();
  if (provider === "openai") return createOpenAI({ apiKey })(modelId);
  return createGoogleGenerativeAI({ apiKey })(modelId);
}

// AI のキーが無効・権限切れで失敗したか。キーの登録し直しを案内するために使う。
// AI SDK は、再試行のあとの失敗を lastError に、包んだ失敗を cause に入れるので、たどって確かめる。
export function isAiKeyRejected(error: unknown): boolean {
  for (let e = error, depth = 0; e && depth < 5; depth += 1) {
    if (typeof e !== "object") return false;
    const { statusCode, responseBody, message } = e as {
      statusCode?: unknown;
      responseBody?: unknown;
      message?: unknown;
    };
    if (statusCode === 401 || statusCode === 403) return true;
    if (statusCode === 400) {
      const text = `${String(responseBody ?? "")} ${String(message ?? "")}`;
      if (/API[_ ]?KEY/i.test(text)) return true;
    }
    e =
      (e as { lastError?: unknown }).lastError ??
      (e as { cause?: unknown }).cause;
  }
  return false;
}
