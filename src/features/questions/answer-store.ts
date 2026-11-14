// back 担当のファイル。
// 共有された問題への回答の保存先。DB の answers テーブルに保存する。
// ログインしていない人は questions も answers も直接は読めないので、共有 ID と選んだ番号を
// DB の関数 answer_shared_question に渡し、保存と正誤・解説の受け取りを 1 回で行う（#157）。
// 正誤は DB が決める（answers のトリガー）。
import type { AnswerResult } from "@/contracts/questions";
import { createAnswerClient } from "@/lib/supabase/answer";

// DB が「選択肢の番号が範囲外」と返したときのエラー
export class InvalidChoiceError extends Error {}

// 回答を保存して、正誤と解説を返す。公開していない問題や、無い shareId は null。
// answererId は、サーバーでログインを確かめた ID（ログインしていなければ null）。履歴に使う
export async function answerSharedQuestion(
  shareId: string,
  choiceIndex: number,
  answererId: string | null,
): Promise<AnswerResult | null> {
  const supabase = createAnswerClient();
  const { data, error } = await supabase.rpc("answer_shared_question", {
    target_share_id: shareId,
    target_choice_index: choiceIndex,
    answerer_id: answererId,
  });
  // 22023 は、DB の関数が選択肢の番号を範囲外と判断したときのコード
  if (error?.code === "22023") throw new InvalidChoiceError(error.message);
  if (error) throw error;

  const row = data[0];
  if (!row) return null;
  return {
    correct: row.is_correct,
    correctIndex: row.correct_index,
    explanation: row.explanation,
  };
}
