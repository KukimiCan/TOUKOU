// back 担当のファイル。
// 資料の AI 生成（POST）。解説と確認問題を作って保存する。作り直しもできる（問題は増えない）。
// 他人の資料と無い ID は 404。AI が失敗したら 502 と分かるメッセージを返す。
// 確認用: curl -X POST http://localhost:3000/api/materials/<id>/generate
import { connection } from "next/server";
import { z } from "zod";

import { generateMaterialResponseSchema } from "@/contracts/materials";
import { getUserId } from "@/features/auth/get-user-id";
import { AiGenerationRateLimitError } from "@/features/materials/ai-generation-limit";
import { generateMaterial } from "@/features/materials/generate-material";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Context) {
  await connection();

  const userId = await getUserId();
  if (!userId) {
    return Response.json({ error: "ログインしてください" }, { status: 401 });
  }

  const id = z.uuid().safeParse((await params).id);
  if (!id.success) {
    return Response.json({ error: "資料が見つかりません" }, { status: 404 });
  }

  try {
    const result = await generateMaterial(userId, id.data);
    if (!result) {
      return Response.json({ error: "資料が見つかりません" }, { status: 404 });
    }
    return Response.json(generateMaterialResponseSchema.parse(result));
  } catch (error) {
    if (error instanceof AiGenerationRateLimitError) {
      return Response.json(
        {
          error:
            "AI の生成回数が上限に達しました。時間をおいてもう一度お試しください",
        },
        {
          status: 429,
          headers: {
            "Cache-Control": "private, no-store",
            "Retry-After": String(error.retryAfterSeconds),
          },
        },
      );
    }
    console.error("資料の AI 生成に失敗しました", error);
    return Response.json(
      {
        error:
          "AI での解説の生成に失敗しました。少し時間をおいてもう一度試してください",
      },
      { status: 502 },
    );
  }
}
