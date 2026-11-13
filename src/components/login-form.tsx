// front 担当のファイル。
// メールアドレスとパスワードでログインするフォーム（/login で使う）。
// ログイン操作だけは、DB 担当が用意したブラウザ用の Supabase クライアントを直接使う（src/lib/supabase/client.ts のコメント参照）。
"use client";

import { isAuthError } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useActionState } from "react";

import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/supabase/env";

// email は、送信後にフォームが空に戻っても入力し直さなくて済むように保持する
type LoginState = { error: string | null; email: string };

// Supabase のエラーを、利用者に分かる日本語にする
function toMessage(error: unknown): string {
  if (isAuthError(error)) {
    switch (error.code) {
      case "invalid_credentials":
        return "メールアドレスかパスワードが違います。";
      case "email_not_confirmed":
        return "メールアドレスの確認がまだ済んでいません。";
      case "over_request_rate_limit":
        return "ログインの試行が多すぎます。少し待ってからもう一度試してください。";
    }
  }
  return "ログインできませんでした。通信状態を確認して、もう一度試してください。";
}

export function LoginForm() {
  const router = useRouter();

  async function login(
    _prev: LoginState,
    formData: FormData,
  ): Promise<LoginState> {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      return { error: "メールアドレスとパスワードを入力してください。", email };
    }
    if (!hasSupabaseEnv()) {
      // 原因（キーの未設定）は開発者向けの情報なので、開発時のログだけに出す
      if (process.env.NODE_ENV === "development") {
        console.error(
          "Supabase の環境変数がありません。.env.local に NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY を設定してください（docs/getting-started.md）。",
        );
      }
      return {
        error: "ログインできませんでした。時間をおいてもう一度試してください。",
        email,
      };
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: toMessage(error), email };
    } catch (error) {
      return { error: toMessage(error), email };
    }

    // ログインできたらホームへ。refresh でログイン後の状態を画面に反映する
    router.replace("/");
    router.refresh();
    return { error: null, email };
  }

  const [state, formAction, pending] = useActionState(login, {
    error: null,
    email: "",
  });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">メールアドレス</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          defaultValue={state.email}
          required
          className="rounded border border-current/30 bg-transparent px-3 py-3 text-base"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">パスワード</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded border border-current/30 bg-transparent px-3 py-3 text-base"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-foreground text-background rounded px-4 py-3 font-semibold disabled:opacity-50"
      >
        {pending ? "ログインしています…" : "ログイン"}
      </button>
    </form>
  );
}
