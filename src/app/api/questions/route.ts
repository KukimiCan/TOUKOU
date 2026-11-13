// back 担当のファイル。
// 問題の一覧（GET）。本人の問題だけ。資料で絞り込める（?materialId=...）。
// 作成は AI の生成（#47）が行う。
// 確認用: curl "http://localhost:3000/api/questions"
import { connection } from "next/server";

import {
  listQuestionsQuerySchema,
  questionsResponseSchema,
} from "@/contracts/questions";
import { getUserId } from "@/features/auth/get-user-id";
import { listQuestions } from "@/features/questions/question-store";

export async function GET(request: Request) {
  await connection();

  const userId = await getUserId();
  if (!userId) {
    return Response.json({ error: "ログインしてください" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = listQuestionsQuerySchema.safeParse({
    materialId: url.searchParams.get("materialId") ?? undefined,
  });
  if (!parsed.success) {
    return Response.json(
      { error: "入力が正しくありません", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const questions = listQuestions(userId, parsed.data.materialId);
  return Response.json(questionsResponseSchema.parse({ questions }));
}
