// DB+security 担当のファイル。
// ブラウザ側（"use client" のコンポーネント）で Supabase を使うときのクライアント。
// 主にログイン操作に使う。データの読み書きは原則 API（src/app/api）を通す。
import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
