// back 担当のファイル。
// 各ユーザーが登録する AI のキー（#220）。ログインしていなければ 401。
// - GET：登録済みかと、キーの末尾 4 文字（キーそのものは返さない）
// - POST：キーを確かめてから、暗号化して保存する。使えないキーは 400、AI 側に届かないときは 502
// - DELETE：登録したキーを消す
// 確認用: curl http://localhost:3000/api/settings/ai-key
import { connection } from "next/server";

import { aiKeyStatusSchema, saveAiKeySchema } from "@/contracts/ai-key";
import {
  deleteAiKey,
  getAiKeyStatus,
  saveAiKey,
} from "@/features/ai-keys/ai-key-store";
import { getUserId } from "@/features/auth/get-user-id";
import { verifyAiKey } from "@/lib/ai/verify-key";

const noStore = { "Cache-Control": "private, no-store" };

function unauthorized() {
  return Response.json({ error: "ログインしてください" }, { status: 401 });
}

async function statusResponse(userId: string) {
  return Response.json(aiKeyStatusSchema.parse(await getAiKeyStatus(userId)), {
    headers: noStore,
  });
}

export async function GET() {
  await connection();

  const userId = await getUserId();
  if (!userId) return unauthorized();

  return statusResponse(userId);
}

export async function POST(request: Request) {
  await connection();

  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = saveAiKeySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: parsed.error.issues[0]?.message ?? "入力が正しくありません",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const check = await verifyAiKey(parsed.data.apiKey);
  if (check === "invalid") {
    return Response.json(
      {
        error:
          "このキーは使えませんでした。コピーし忘れた文字が無いか確かめてください",
      },
      { status: 400 },
    );
  }
  if (check === "unavailable") {
    return Response.json(
      {
        error:
          "キーを確かめられませんでした。少し時間をおいてもう一度試してください",
      },
      { status: 502 },
    );
  }

  await saveAiKey(userId, parsed.data.apiKey);
  return statusResponse(userId);
}

export async function DELETE() {
  await connection();

  const userId = await getUserId();
  if (!userId) return unauthorized();

  await deleteAiKey(userId);
  return statusResponse(userId);
}
