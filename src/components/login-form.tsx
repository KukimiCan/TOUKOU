// front 担当のファイル。
// メールアドレスとパスワードでログインするフォーム（/login で使う）。
// ログインはログイン API（POST /api/auth/login）に fetch で送る。画面から Supabase を直接呼ばない。
"use client";

import { CircleAlert, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";

import { ApiError, fetchApi } from "@/components/fetch-api";
import { Button } from "@/components/ui/button";
import { type LoginRequest, loginResponseSchema } from "@/contracts/auth";

// email は、送信後にフォームが空に戻っても入力し直さなくて済むように保持する。
// done は、ログインできてホームへ移動している途中であることを表す（ボタンを処理中のままにする）
type LoginState = { error: string | null; email: string; done: boolean };

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

// 入力欄。globals.css の input の指定（余白・枠）はレイヤーの外にあり、通常のクラスより強いので、
// 左のアイコンの分の余白と、エラーのときの枠の色は ! を付けて上書きする
const inputClass =
  "w-full py-3! pl-10! text-base placeholder:text-muted aria-invalid:border-danger!";
const iconClass =
  "text-muted group-focus-within:text-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 transition-colors";

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  async function login(
    _prev: LoginState,
    formData: FormData,
  ): Promise<LoginState> {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      return {
        error: "メールアドレスとパスワードを入力してください。",
        email,
        done: false,
      };
    }

    try {
      const body: LoginRequest = { email, password };
      const res = await fetchApi("/api/auth/login", { method: "POST", body });
      loginResponseSchema.parse(await res.json());
    } catch (error) {
      return { error: toMessage(error), email, done: false };
    }

    // ログインできたらホームへ。refresh でログイン後の状態を画面に反映する
    router.replace("/");
    router.refresh();
    return { error: null, email, done: true };
  }

  const [state, formAction, pending] = useActionState(login, {
    error: null,
    email: "",
    done: false,
  });

  const busy = pending || state.done;
  // エラーのときは、入力欄の枠を赤くし、読み上げでもエラー文とつなげる
  const errorProps = state.error
    ? { "aria-invalid": true, "aria-describedby": "login-error" }
    : {};

  // noValidate：ブラウザの英語まじりの吹き出しではなく、下の日本語のエラーで伝える
  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-email" className="text-sm font-semibold">
          メールアドレス
        </label>
        <div className="group relative">
          <Mail aria-hidden className={iconClass} />
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="you@example.ac.jp"
            defaultValue={state.email}
            required
            {...errorProps}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="login-password" className="text-sm font-semibold">
          パスワード
        </label>
        <div className="group relative">
          <LockKeyhole aria-hidden className={iconClass} />
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            {...errorProps}
            className={`${inputClass} pr-12!`}
          />
          {/* パスワードの表示切り替え。入力欄の右端に置き、押す場所は 44px 幅にする */}
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={
              showPassword ? "パスワードを隠す" : "パスワードを表示する"
            }
            aria-pressed={showPassword}
            className="text-muted hover:text-foreground absolute inset-y-0 right-0 flex w-11 items-center justify-center transition-colors"
          >
            {showPassword ? (
              <EyeOff aria-hidden className="size-4" />
            ) : (
              <Eye aria-hidden className="size-4" />
            )}
          </button>
        </div>
      </div>

      {/* エラー：何が起きたかと次にやることを、ボタンのすぐ上に出す */}
      {state.error && (
        <p
          id="login-error"
          role="alert"
          className="bg-danger/10 text-danger flex items-start gap-2 rounded-sm px-3 py-2.5 text-sm [word-break:auto-phrase]"
        >
          <CircleAlert aria-hidden className="mt-1 size-4 shrink-0" />
          <span>{state.error}</span>
        </p>
      )}

      <Button
        type="submit"
        loading={busy}
        className="mt-1 w-full whitespace-nowrap"
      >
        {state.done
          ? "ホームへ移動しています"
          : pending
            ? "ログインしています"
            : "ログイン"}
      </Button>
    </form>
  );
}
