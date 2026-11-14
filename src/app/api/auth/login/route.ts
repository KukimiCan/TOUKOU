// DB+security 担当のファイル。
// ログイン（POST）。画面はここへ fetch で送る（画面から Supabase を直接呼ばない）。
// 成功したら、セッションの cookie をサーバーが付ける。失敗は理由を言わず 401 にする。
// パスワードはログに出さない。
import { connection } from "next/server";

import { loginRequestSchema, loginResponseSchema } from "@/contracts/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createLoginClient } from "@/lib/supabase/login";
import { createClient } from "@/lib/supabase/server";

const noStore = { "Cache-Control": "private, no-store" };

export async function POST(request: Request) {
  await connection();

  const body = await request.json().catch(() => null);
  const parsed = loginRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "メールアドレスとパスワードを入力してください" },
      { status: 400, headers: noStore },
    );
  }

  const isVercel = process.env.VERCEL === "1";
  if (
    !hasSupabaseEnv() ||
    (isVercel && !process.env.SUPABASE_SECRET_KEY?.startsWith("sb_secret_"))
  ) {
    return Response.json(
      { error: "ログインの設定が済んでいません" },
      { status: 500, headers: noStore },
    );
  }

  const supabase = await createClient();
  const loginClient = isVercel ? createLoginClient(request) : supabase;
  const { data, error } = await loginClient.auth.signInWithPassword(
    parsed.data,
  );
  if (error) {
    if (error.status === 429) {
      return Response.json(
        { error: "しばらく待ってからもう一度お試しください" },
        { status: 429, headers: noStore },
      );
    }
    return Response.json(
      { error: "メールアドレスかパスワードが違います" },
      { status: 401, headers: noStore },
    );
  }

  if (!data.session) {
    return Response.json(
      { error: "ログインできませんでした" },
      { status: 500, headers: noStore },
    );
  }

  if (isVercel) {
    // サーバー専用キーのクライアントには Cookie を保存しない。
    // 公開用キーの SSR クライアントへ利用者のセッションを渡す。
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
    if (sessionError) {
      return Response.json(
        { error: "ログインできませんでした" },
        { status: 500, headers: noStore },
      );
    }
  }

  return Response.json(loginResponseSchema.parse({ ok: true }), {
    headers: noStore,
  });
}
