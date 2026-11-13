// back 担当のファイル。
// 共有された問題の取得（GET）。ログインは要らない。
// 返すのは問題文と選択肢だけ。正解・解説・元の板書画像・作った人の情報は返さない。
// 公開していない問題や無い shareId は 404。
// 確認用: curl http://localhost:3000/api/shared/<shareId>
import { connection } from "next/server";

import { sharedQuestionResponseSchema } from "@/contracts/questions";
import { findSharedQuestion } from "@/features/questions/question-store";

type Context = { params: Promise<{ shareId: string }> };

export async function GET(_request: Request, { params }: Context) {
  await connection();

  const { shareId } = await params;
  const question = findSharedQuestion(shareId);
  if (!question) {
    return Response.json({ error: "問題が見つかりません" }, { status: 404 });
  }

  return Response.json(
    sharedQuestionResponseSchema.parse({
      question: {
        shareId: question.shareId,
        prompt: question.prompt,
        choices: question.choices,
      },
    }),
  );
}
