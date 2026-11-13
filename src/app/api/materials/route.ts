// back 担当のファイル。
// 資料の一覧（GET）と、板書画像のアップロード（POST）。
// 一覧は科目で絞り込める（?courseId=...）。アップロードは multipart/form-data で、画像は "file"。
// 確認用: curl "http://localhost:3000/api/materials?courseId=<科目の id>"
import { connection } from "next/server";

import {
  listMaterialsQuerySchema,
  materialResponseSchema,
  materialsResponseSchema,
  uploadMaterialFormSchema,
} from "@/contracts/materials";
import { getUserId } from "@/features/auth/get-user-id";
import { listCourses } from "@/features/courses/course-store";
import {
  addUploadedMaterial,
  listMaterials,
} from "@/features/materials/material-store";

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

export async function POST(request: Request) {
  await connection();

  const userId = await getUserId();
  if (!userId) {
    return Response.json({ error: "ログインしてください" }, { status: 401 });
  }

  // 形式（multipart/form-data）でなければ 400
  const form = await request.formData().catch(() => null);
  if (!form) {
    return Response.json(
      { error: "画像は multipart/form-data で送ってください" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  const parsed = uploadMaterialFormSchema.safeParse({
    courseId: form.get("courseId"),
    kind: form.get("kind") ?? undefined,
    file: file instanceof File ? file : undefined,
  });
  if (!parsed.success) {
    return Response.json(
      {
        error:
          parsed.error.issues.find((i) => i.path[0] === "file")?.message ??
          "入力が正しくありません",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  // 科目は本人のものだけ使える
  const { courseId, kind, file: image } = parsed.data;
  if (!(await listCourses(userId)).some((course) => course.id === courseId)) {
    return Response.json({ error: "科目が見つかりません" }, { status: 400 });
  }

  const bytes = new Uint8Array(await image.arrayBuffer());
  const material = addUploadedMaterial(userId, {
    courseId,
    kind,
    bytes,
    mimeType: image.type,
  });
  return Response.json(materialResponseSchema.parse({ material }), {
    status: 201,
  });
}
