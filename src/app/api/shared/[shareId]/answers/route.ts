// back 担当のファイル。
// 共有された問題への回答（POST）。ログインは要らない。
// 回答を保存し、正誤と解説を返す。選択肢の数を超える番号は 400。
// 公開していない問題や無い shareId は 404。
// 確認用: curl -X POST -H "Content-Type: application/json" -d '{"choiceIndex":1}' http://localhost:3000/api/shared/<shareId>/answers
import { connection } from "next/server";

import {
  answerResultResponseSchema,
  submitAnswerSchema,
} from "@/contracts/questions";
import { answerResultFor, saveAnswer } from "@/features/questions/answer-store";
import { findSharedQuestion } from "@/features/questions/question-store";

type Context = { params: Promise<{ shareId: string }> };

export async function POST(request: Request, { params }: Context) {
  await connection();

  const { shareId } = await params;
  const question = findSharedQuestion(shareId);
  if (!question) {
    return Response.json({ error: "問題が見つかりません" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = submitAnswerSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "入力が正しくありません", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  // 契約では 0〜5 までしか見ていないので、この問題の選択肢の数を確かめる
  const { choiceIndex } = parsed.data;
  if (choiceIndex >= question.choices.length) {
    return Response.json(
      { error: "選択肢の番号が範囲外です" },
      { status: 400 },
    );
  }

  const result = answerResultFor(question, choiceIndex);
  saveAnswer(shareId, choiceIndex, result.correct);
  return Response.json(answerResultResponseSchema.parse({ result }));
}
