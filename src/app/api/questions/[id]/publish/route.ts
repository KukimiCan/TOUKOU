// back 担当のファイル。
// 問題を公開する（POST）。is_public を true にして、共有 URL（shareId）を返す。
// 本人の問題だけ。他人の問題と無い ID は 404。何度押しても同じ shareId を返す。
// 確認用: curl -X POST http://localhost:3000/api/questions/<id>/publish
import { connection } from "next/server";
import { z } from "zod";

import { publishQuestionResponseSchema } from "@/contracts/questions";
import { getUserId } from "@/features/auth/get-user-id";
import { publishQuestion } from "@/features/questions/question-store";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Context) {
  await connection();

  const userId = await getUserId();
  if (!userId) {
    return Response.json({ error: "ログインしてください" }, { status: 401 });
  }

  const id = z.uuid().safeParse((await params).id);
  const question = id.success ? await publishQuestion(userId, id.data) : null;
  if (!question || !question.shareId) {
    return Response.json({ error: "問題が見つかりません" }, { status: 404 });
  }

  return Response.json(
    publishQuestionResponseSchema.parse({
      shareId: question.shareId,
      sharePath: `/q/${question.shareId}`,
    }),
  );
}
