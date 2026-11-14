// back 担当のファイル。
// 共有された問題への回答（POST）。ログインは要らない。
// ログイン中なら、誰が答えたかも保存する（履歴は GET /api/answers/history）。
// 回答を DB に保存し、正誤と解説を返す（DB の関数 answer_shared_question）。選択肢の数を超える番号は 400。
// 公開していない問題や無い shareId は 404。
// 同じ送信元が同じ問題に短い間に何度も送ったら 429（回数と数え方は answer-rate-limit.ts）。
// 確認用: curl -X POST -H "Content-Type: application/json" -d '{"choiceIndex":1}' http://localhost:3000/api/shared/<shareId>/answers
import { connection } from "next/server";

import {
  answerResultResponseSchema,
  submitAnswerSchema,
} from "@/contracts/questions";
import { getUserId } from "@/features/auth/get-user-id";
import {
  answerSource,
  checkAnswerRate,
} from "@/features/questions/answer-rate-limit";
import {
  InvalidChoiceError,
  answerSharedQuestion,
} from "@/features/questions/answer-store";
import { getSharedQuestion } from "@/features/questions/question-store";

type Context = { params: Promise<{ shareId: string }> };

export async function POST(request: Request, { params }: Context) {
  await connection();

  const { shareId } = await params;
  const question = await getSharedQuestion(shareId);
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

  // 保存する前に、連投になっていないか確かめる（保存先が DB になっても、ここで止める）
  const rate = checkAnswerRate(answerSource(request), shareId);
  if (!rate.allowed) {
    return Response.json(
      {
        error: "回答の回数が多すぎます。少し時間をおいてもう一度試してください",
      },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfterSeconds) },
      },
    );
  }

  // 保存と正誤の判定は DB が行う。確かめたあとで公開をやめた問題は 404
  try {
    const result = await answerSharedQuestion(
      shareId,
      choiceIndex,
      // 履歴に残すため、ログイン中ならサーバーで確かめた ID を渡す（利用者が送った値は使わない）
      await getUserId(),
    );
    if (!result) {
      return Response.json({ error: "問題が見つかりません" }, { status: 404 });
    }
    return Response.json(answerResultResponseSchema.parse({ result }));
  } catch (error) {
    if (error instanceof InvalidChoiceError) {
      return Response.json(
        { error: "選択肢の番号が範囲外です" },
        { status: 400 },
      );
    }
    throw error;
  }
}
