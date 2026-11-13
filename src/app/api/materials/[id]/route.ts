// back 担当のファイル。
// 資料の詳細（GET）。AI の解説と、元画像の一時 URL を返す。
// 他人の資料と無い ID は 404（存在を知らせない）。
// 確認用: curl http://localhost:3000/api/materials/<id>
import { connection } from "next/server";
import { z } from "zod";

import { materialDetailResponseSchema } from "@/contracts/materials";
import { getUserId } from "@/features/auth/get-user-id";
import { getMaterial } from "@/features/materials/material-store";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  await connection();

  const userId = await getUserId();
  if (!userId) {
    return Response.json({ error: "ログインしてください" }, { status: 401 });
  }

  const id = z.uuid().safeParse((await params).id);
  const item = id.success ? await getMaterial(userId, id.data) : null;
  if (!item) {
    return Response.json({ error: "資料が見つかりません" }, { status: 404 });
  }

  return Response.json(
    materialDetailResponseSchema.parse({
      material: item.material,
      imageUrl: new URL(
        `/api/materials/${item.material.id}/image`,
        request.url,
      ).toString(),
      explanation: item.explanation,
    }),
  );
}
