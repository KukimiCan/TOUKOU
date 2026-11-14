// back 担当のファイル。
// ログイン中のユーザーの ID を返す。ログインしていない、または Supabase が未設定のときは null。
// Supabase のログイン処理そのものは DB+security 担当（issue #6）。ここは確認だけ。
//
// getClaims() は、ログインの印（JWT）の署名を手元で確かめる（署名鍵は ES256。公開鍵は一度取れば覚えておく）。
// getUser() のように毎回 Supabase に問い合わせないので、API が 1 往復ぶん速くなる（#206）。
// 期限切れや改ざんされた印は null になる。
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

import { isTrialExpired } from "./trial";

export async function getUserId(): Promise<string | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) return null;
  // 期限を過ぎた体験用アカウントは、ログインしていない扱いにする（#216）
  if (isTrialExpired(data.claims.app_metadata)) return null;

  return data.claims.sub;
}
