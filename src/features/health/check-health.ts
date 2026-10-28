// back 担当のファイル。
// 業務ロジックは src/features/<機能名>/ に置く。Route Handler からはこの関数を呼ぶだけにする。
import type { HealthResponse } from "@/contracts/health";
import { getAiProvider, hasAiKey } from "@/lib/ai";
import { getSupabaseEnv, hasSupabaseEnv } from "@/lib/supabase/env";

async function canReachSupabase() {
  if (!hasSupabaseEnv()) return false;
  const { url, publishableKey } = getSupabaseEnv();
  try {
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: publishableKey },
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function checkHealth(): Promise<HealthResponse> {
  const supabaseConfigured = hasSupabaseEnv();
  const supabaseReachable = await canReachSupabase();
  const aiConfigured = hasAiKey();

  return {
    ok: supabaseReachable && aiConfigured,
    supabase: { configured: supabaseConfigured, reachable: supabaseReachable },
    ai: { provider: getAiProvider(), configured: aiConfigured },
  };
}
