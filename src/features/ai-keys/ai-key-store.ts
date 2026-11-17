// back 担当のファイル。
// ユーザーが登録した AI のキーの保存先（DB の user_ai_keys テーブル。本人の行だけ読み書きできる RLS）（#220）。
// キーは暗号化して保存し、画面には「登録済みか」と末尾 4 文字だけを返す。キーそのものは画面へ返さない。
import type { AiKeyStatus } from "@/contracts/ai-key";
import { getAiProvider, isMockAi } from "@/lib/ai";
import { createClient } from "@/lib/supabase/server";

import { decryptAiKey, encryptAiKey } from "./key-crypto";

// 生成のときにキーが無い（未登録・別の AI 用・復号できない）
export class AiKeyMissingError extends Error {
  constructor() {
    super("AI のキーが登録されていません");
  }
}

// 登録したキーを AI 側が受け付けなかった（無効にした、権限が無い、など）
export class AiKeyRejectedError extends Error {
  constructor() {
    super("登録した AI のキーが使えませんでした");
  }
}

function keyHint(apiKey: string) {
  return apiKey.slice(-4);
}

export async function getAiKeyStatus(userId: string): Promise<AiKeyStatus> {
  const provider = getAiProvider();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_ai_keys")
    .select("provider, key_hint, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;

  // 別の AI（openai と google）のキーは、今は使えないので「未登録」として見せる
  const usable = data !== null && data.provider === provider;
  return {
    provider,
    required: !isMockAi(),
    registered: usable,
    hint: usable ? data.key_hint : null,
    updatedAt: usable ? data.updated_at : null,
  };
}

export async function saveAiKey(userId: string, apiKey: string) {
  const provider = getAiProvider();
  if (provider === "mock") return;

  const supabase = await createClient();
  const { error } = await supabase.from("user_ai_keys").upsert(
    {
      user_id: userId,
      provider,
      encrypted_key: encryptAiKey(userId, apiKey),
      key_hint: keyHint(apiKey),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

export async function deleteAiKey(userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("user_ai_keys")
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
}

// 生成に使うキー（復号したもの）。使えるキーが無ければ AiKeyMissingError
export async function requireAiKey(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_ai_keys")
    .select("provider, encrypted_key")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data || data.provider !== getAiProvider()) throw new AiKeyMissingError();

  const apiKey = decryptAiKey(userId, data.encrypted_key);
  if (!apiKey) throw new AiKeyMissingError();
  return apiKey;
}
