// back 担当。実 AI の生成回数を、全サーバーで共有する DB のカウンタで制限する。
import { createClient } from "@/lib/supabase/server";

export class AiGenerationRateLimitError extends Error {
  constructor(readonly retryAfterSeconds: number) {
    super("AI の生成回数が上限に達しました");
  }
}

export async function consumeAiGenerationSlot(): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("consume_ai_generation_slot");
  if (error) throw error;

  const result = data[0];
  if (!result) throw new Error("AI 生成の回数を確認できませんでした");
  if (!result.allowed) {
    throw new AiGenerationRateLimitError(result.retry_after_seconds);
  }
}
