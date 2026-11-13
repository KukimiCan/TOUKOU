import type { User } from "@supabase/supabase-js";

import { hasSupabaseEnv } from "./env";
import { createClient } from "./server";

/**
 * API の Route Handler でログイン中のユーザーを取得する。
 * 例: const user = await getCurrentUser(); if (!user) return unauthorizedResponse;
 * Supabase にユーザーを確認し、未ログインまたは確認失敗なら null を返す。
 * 認可には user.id を使い、クライアントから渡された user_id は信用しない。
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  return error ? null : data.user;
}
