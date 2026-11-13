// front 担当のファイル。
// ログアウトのボタン。押すと API（POST /api/auth/logout）を呼んで、ログイン画面へ移る。
// 画面から Supabase を直接呼ばない。/login と共有ページ（/q/...）では表示しない。
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError, fetchApi } from "@/components/fetch-api";
import { logoutResponseSchema } from "@/contracts/auth";

export function LogoutButton() {
  const pathname = usePathname();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (pathname === "/login" || pathname.startsWith("/q/")) return null;

  async function onLogout() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetchApi("/api/auth/logout", { method: "POST" });
      logoutResponseSchema.parse(await res.json());
      router.push("/login");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "ログアウトできませんでした。もう一度試してください。",
      );
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2 px-4 pt-3 text-sm">
      {error && (
        <span role="alert" className="rounded bg-red-50 px-2 py-1 text-red-700">
          {error}
        </span>
      )}
      <button
        type="button"
        onClick={onLogout}
        disabled={busy}
        className="rounded border border-current px-3 py-1 disabled:opacity-50"
      >
        ログアウト
      </button>
    </div>
  );
}
