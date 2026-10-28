// DB+security 担当のファイル。
// サーバー側（Route Handler、Server Component）で Supabase を使うときのクライアント。
// ログイン中のユーザーとして DB にアクセスするので、RLS（Row Level Security）が効く。
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "./env";

export async function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component からは cookie を書き込めない。
          // セッションの更新は proxy（認証の issue で追加する）で行うので、ここでは無視してよい。
        }
      },
    },
  });
}
