// back 担当のファイル。
// 科目の変更（PATCH）と削除（DELETE）。ログインしていなければ 401、他人の科目や無い ID は 404。
// 確認用: curl -X PATCH http://localhost:3000/api/courses/<id>
import { connection } from "next/server";
import { z } from "zod";

import { courseResponseSchema, updateCourseSchema } from "@/contracts/courses";
import { getUserId } from "@/features/auth/get-user-id";
import { deleteCourse, updateCourse } from "@/features/courses/course-store";

type Context = { params: Promise<{ id: string }> };

function unauthorized() {
  return Response.json({ error: "ログインしてください" }, { status: 401 });
}

function notFound() {
  return Response.json({ error: "科目が見つかりません" }, { status: 404 });
}

// URL の ID が uuid の形でなければ、見つからないのと同じ扱いにする
async function readId({ params }: Context) {
  const { id } = await params;
  return z.string().uuid().safeParse(id);
}

export async function PATCH(request: Request, context: Context) {
  await connection();

  const userId = await getUserId();
  if (!userId) return unauthorized();

  const id = await readId(context);
  if (!id.success) return notFound();

  const body = await request.json().catch(() => null);
  const parsed = updateCourseSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "入力が正しくありません", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const course = updateCourse(userId, id.data, parsed.data);
  if (!course) return notFound();

  return Response.json(courseResponseSchema.parse({ course }));
}

export async function DELETE(_request: Request, context: Context) {
  await connection();

  const userId = await getUserId();
  if (!userId) return unauthorized();

  const id = await readId(context);
  if (!id.success) return notFound();

  if (!deleteCourse(userId, id.data)) return notFound();

  return new Response(null, { status: 204 });
}
