// back 担当のファイル。
// 元の板書画像を返す（GET）。本人の資料だけ。他人の資料と無い ID は 404。
// 画像は本人の端末にだけ返し、他の人には共有しない（キャッシュもさせない）。
// 確認用: ブラウザで http://localhost:3000/api/materials/<id>/image を開く（ログイン中）
import { connection } from "next/server";
import { z } from "zod";

import { getUserId } from "@/features/auth/get-user-id";
import { getImage } from "@/features/materials/material-store";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  await connection();

  const userId = await getUserId();
  if (!userId) {
    return Response.json({ error: "ログインしてください" }, { status: 401 });
  }

  const id = z.uuid().safeParse((await params).id);
  const image = id.success ? await getImage(userId, id.data) : null;
  if (!image) {
    return Response.json({ error: "資料が見つかりません" }, { status: 404 });
  }

  return new Response(new Blob([new Uint8Array(image.bytes)]), {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "private, no-store",
    },
  });
}
