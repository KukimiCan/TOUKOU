// AI 担当のファイル。
// ユーザーが登録しようとしている AI のキーが使えるかを、登録の前に確かめる（#220）。
// 文章を作らせると費用と時間がかかるので、モデルの情報を 1 回読むだけにする（読むだけなら無料）。
import { getAiProvider, getModelId } from "./index";

// ok：使える / invalid：キーが無効、またはこのモデルを使えない / unavailable：AI 側に届かない（時間をおいて再試行）
export type AiKeyCheck = "ok" | "invalid" | "unavailable";

function modelInfoRequest(apiKey: string): Request | null {
  const provider = getAiProvider();
  const model = encodeURIComponent(getModelId());
  if (provider === "google") {
    return new Request(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}`,
      { headers: { "x-goog-api-key": apiKey } },
    );
  }
  if (provider === "openai") {
    return new Request(`https://api.openai.com/v1/models/${model}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  }
  return null;
}

export async function verifyAiKey(apiKey: string): Promise<AiKeyCheck> {
  const request = modelInfoRequest(apiKey);
  // mock のときは外部に送らない（開発中はどんな文字でも登録できる）
  if (!request) return "ok";

  try {
    const res = await fetch(request, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return "ok";
    // 400（キーの形が違う）、401・403（無効・権限なし）、404（このキーでモデルが見えない）
    if ([400, 401, 403, 404].includes(res.status)) return "invalid";
    return "unavailable";
  } catch {
    return "unavailable";
  }
}
