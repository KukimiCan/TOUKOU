// back 担当のファイル。
// 業務ロジックは src/features/<機能名>/ に置く。Route Handler からはこの関数を呼ぶだけにする。
import type { HealthResponse } from "@/contracts/health";
import { hasEncryptionSecret } from "@/features/ai-keys/key-crypto";
import { getAiProvider, isMockAi } from "@/lib/ai";
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
  // AI のキーは各ユーザーが登録する（#220）。サーバーには、キーを暗号化する秘密があればよい
  const aiConfigured =
    isMockAi() || (Boolean(process.env.AI_MODEL) && hasEncryptionSecret());

  return {
    ok: supabaseReachable && aiConfigured,
    supabase: { configured: supabaseConfigured, reachable: supabaseReachable },
    ai: { provider: getAiProvider(), configured: aiConfigured },
  };
}
