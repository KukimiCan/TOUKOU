// back 担当のファイル。
// Route Handler は「ログインを確かめる → 入力を確認する → features の関数を呼ぶ → JSON を返す」だけにする。
// 確認用: curl http://localhost:3000/api/courses
import { connection } from "next/server";

import { courseResponseSchema, createCourseSchema } from "@/contracts/courses";
import { getUserId } from "@/features/auth/get-user-id";
import { addCourse, listCourses } from "@/features/courses/course-store";

function unauthorized() {
  return Response.json({ error: "ログインしてください" }, { status: 401 });
}

export async function GET() {
  // ログインのたびに結果が変わるので、ビルド時に固定しない
  await connection();

  const userId = await getUserId();
  if (!userId) return unauthorized();

  return Response.json({ courses: await listCourses(userId) });
}

export async function POST(request: Request) {
  await connection();

  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = createCourseSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "入力が正しくありません", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const course = await addCourse(userId, parsed.data);
  return Response.json(courseResponseSchema.parse({ course }), { status: 201 });
}
