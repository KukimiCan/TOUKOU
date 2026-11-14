// back 担当のファイル。
// ログイン中のユーザーの ID を返す。ログインしていない、または Supabase が未設定のときは null。
// Supabase のログイン処理そのものは DB+security 担当（issue #6）。ここは確認だけ。
//
// getClaims() は、ログインの印（JWT）の署名を手元で確かめる（署名鍵は ES256。公開鍵は一度取れば覚えておく）。
// getUser() のように毎回 Supabase に問い合わせないので、API が 1 往復ぶん速くなる（#206）。
// 期限切れや改ざんされた印は null になる。
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function getUserId(): Promise<string | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) return null;

  return data.claims.sub;
}
