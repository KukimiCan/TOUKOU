// front 担当のファイル。
// メールアドレスとパスワードでログインするフォーム（/login で使う）。
// ログインはログイン API（POST /api/auth/login）に fetch で送る。画面から Supabase を直接呼ばない。
"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";

import { ApiError, fetchApi } from "@/components/fetch-api";
import { type LoginRequest, loginResponseSchema } from "@/contracts/auth";

// email は、送信後にフォームが空に戻っても入力し直さなくて済むように保持する
type LoginState = { error: string | null; email: string };

// ログイン API の失敗を、利用者に分かる日本語にする。
// fetchApi の 401 の文（「ログインが切れているかも」）はログイン画面には合わないので、ここで言い換える
function toMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 0:
        return "ログインできませんでした。インターネットにつながっているか確かめて、もう一度試してください。";
      case 400:
        return "メールアドレスとパスワードを確かめてください。";
      case 401:
        return "メールアドレスかパスワードが違います。";
    }
  }
  return "ログインできませんでした。時間をおいてもう一度試してください。";
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

    try {
      const body: LoginRequest = { email, password };
      const res = await fetchApi("/api/auth/login", { method: "POST", body });
      loginResponseSchema.parse(await res.json());
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
