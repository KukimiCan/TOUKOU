// back 担当のファイル。
// ログイン中のユーザーが解いた共有問題の履歴。DB の関数 my_answer_history を、
// ユーザーの session のクライアントで呼ぶ（DB 側が auth.uid() の回答だけを返す）。
import type { AnswerHistoryItem } from "@/contracts/history";
import { createClient } from "@/lib/supabase/server";

export async function listAnswerHistory(): Promise<AnswerHistoryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_answer_history");
  if (error) throw error;

  return data.map((row) => ({
    shareId: row.share_id,
    prompt: row.prompt,
    correct: row.is_correct,
    // DB の日時（例: 2026-11-13T13:43:50.83+00:00）を、契約の形にそろえる
    answeredAt: new Date(row.answered_at).toISOString(),
  }));
}
