// back 担当のファイル。
// 資料の一覧（GET）。科目で絞り込める（?courseId=...）。アップロードは issue #45。
// 確認用: curl "http://localhost:3000/api/materials?courseId=<科目の id>"
import { connection } from "next/server";

import {
  listMaterialsQuerySchema,
  materialsResponseSchema,
} from "@/contracts/materials";
import { getUserId } from "@/features/auth/get-user-id";
import { listMaterials } from "@/features/materials/material-store";

export async function GET(request: Request) {
  await connection();

  const userId = await getUserId();
  if (!userId) {
    return Response.json({ error: "ログインしてください" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = listMaterialsQuerySchema.safeParse({
    courseId: url.searchParams.get("courseId") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json(
      { error: "入力が正しくありません", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const materials = listMaterials(userId, parsed.data.courseId);
  return Response.json(materialsResponseSchema.parse({ materials }));
}
