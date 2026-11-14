// back 担当のファイル。
// ログイン中のユーザーが解いた共有問題の履歴（GET）。新しい順に最大 100 件。ログインしていなければ 401。
// 確認用: curl "http://localhost:3000/api/answers/history"（ログイン後の cookie が必要）
import { connection } from "next/server";

import { answerHistoryResponseSchema } from "@/contracts/history";
import { getUserId } from "@/features/auth/get-user-id";
import { listAnswerHistory } from "@/features/questions/answer-history";

export async function GET() {
  await connection();

  const userId = await getUserId();
  if (!userId) {
    return Response.json({ error: "ログインしてください" }, { status: 401 });
  }

  const items = await listAnswerHistory();
  return Response.json(answerHistoryResponseSchema.parse({ items }));
}
