// DB+security 担当。ログイン時だけ使うサーバー専用クライアント。
import { isIP } from "node:net";

import { createClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "./env";

export function createLoginClient(request: Request) {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey?.startsWith("sb_secret_")) {
    throw new Error("SUPABASE_SECRET_KEY is not configured");
  }

  const { url } = getSupabaseEnv();
  // Vercel は x-forwarded-for を上書きする。開発サーバーなどでは送信者が偽装できるため使わない。
  const forwarded =
    process.env.VERCEL === "1" ? request.headers.get("x-forwarded-for") : null;
  const ip = forwarded?.split(",")[0]?.trim();
  const headers = ip && isIP(ip) ? { "Sb-Forwarded-For": ip } : undefined;

  return createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: { headers },
  });
}
