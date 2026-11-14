// back 担当のファイル。
// 問題の保存先。DB の questions テーブル（RLS で本人の行だけ読み書きできる）に保存する。
// 共有された問題（ログイン不要）は、questions を直接読まず、共有 ID を指定する DB の関数
// get_shared_question で読む（#157）。匿名の人には、問題文と選択肢しか渡らない。
// 列名（snake_case）と契約の名前（camelCase）の変換はこのファイルで行う。
import type { Question, SharedQuestion } from "@/contracts/questions";
import { generatedQuestionSchema } from "@/lib/ai/question-schema";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];

const choicesSchema = generatedQuestionSchema.shape.choices;

function toQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    materialId: row.material_id,
    prompt: row.prompt,
    choices: choicesSchema.parse(row.choices),
    answerIndex: row.answer_index,
    explanation: row.explanation,
    isPublic: row.is_public,
    shareId: row.share_id,
    // DB の日時（例: 2026-11-13T13:43:50.83+00:00）を、契約の形にそろえる
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function listQuestions(
  userId: string,
  materialId?: string,
): Promise<Question[]> {
  const supabase = await createClient();
  let query = supabase
    .from("questions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at");
  if (materialId) query = query.eq("material_id", materialId);

  const { data, error } = await query;
  if (error) throw error;
  return data.map(toQuestion);
}

// 公開する。すでに公開済みなら、同じ共有 URL（shareId）を返す。
// 見つからない（他人の問題も含む）ときは null。RLS で他人の行は見えない
export async function publishQuestion(
  userId: string,
  id: string,
): Promise<Question | null> {
  const supabase = await createClient();
  const { data: current, error } = await supabase
    .from("questions")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!current) return null;
  if (current.is_public && current.share_id) return toQuestion(current);

  // 共有 ID は推測されにくい UUID（ハイフン付き）。DB の制約もこの形に限っている
  const { data, error: updateError } = await supabase
    .from("questions")
    .update({ is_public: true, share_id: crypto.randomUUID() })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();
  if (updateError) throw updateError;
  return data ? toQuestion(data) : null;
}

// 共有 URL（shareId）から公開中の問題を探す。ログインは要らない。
// 返すのは問題文と選択肢だけ。公開していない問題や、無い shareId は null
export async function getSharedQuestion(
  shareId: string,
): Promise<SharedQuestion | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_shared_question", {
    target_share_id: shareId,
  });
  if (error) throw error;

  const row = data[0];
  if (!row) return null;
  return {
    shareId,
    prompt: row.prompt,
    choices: choicesSchema.parse(row.choices),
  };
}

// 資料の問題をまとめて入れ替える（作り直しのときに問題を増やさないため）。
// 先に新しい問題を入れてから古い問題を消す（途中で失敗しても、問題が無い状態にならない）。
// 古い問題を消すと、その問題の共有 URL と回答も消える
export async function replaceQuestionsForMaterial(
  userId: string,
  materialId: string,
  questions: Question[],
): Promise<void> {
  const supabase = await createClient();
  const { data: old, error: oldError } = await supabase
    .from("questions")
    .select("id")
    .eq("user_id", userId)
    .eq("material_id", materialId);
  if (oldError) throw oldError;

  if (questions.length > 0) {
    const { error } = await supabase.from("questions").insert(
      questions.map((q) => ({
        id: q.id,
        user_id: userId,
        material_id: materialId,
        prompt: q.prompt,
        choices: q.choices,
        answer_index: q.answerIndex,
        explanation: q.explanation,
      })),
    );
    if (error) throw error;
  }

  if (old.length > 0) {
    const { error } = await supabase
      .from("questions")
      .delete()
      .in(
        "id",
        old.map((q) => q.id),
      );
    if (error) throw error;
  }
}
