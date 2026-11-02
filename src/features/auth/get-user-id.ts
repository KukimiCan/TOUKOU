// back 担当のファイル。
// ログイン中のユーザーの ID を返す。ログインしていない、または Supabase が未設定のときは null。
// Supabase のログイン処理そのものは DB+security 担当（issue #6）。ここは確認だけ。
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function getUserId(): Promise<string | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  return data.user.id;
}
