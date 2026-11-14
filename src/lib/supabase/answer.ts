// DB+security 担当。公開回答の保存にだけ使うサーバー専用クライアント。
// 誰でも呼べる回答 API 側で回数制限を通してから、このクライアントの RPC を呼ぶ。
import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { getSupabaseEnv } from "./env";

export function createAnswerClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey?.startsWith("sb_secret_")) {
    throw new Error("SUPABASE_SECRET_KEY is not configured");
  }

  const { url } = getSupabaseEnv();
  return createClient<Database>(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
