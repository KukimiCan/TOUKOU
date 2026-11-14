// front 担当のファイル。
// ログアウトのボタン。押すと API（POST /api/auth/logout）を呼んで、ログイン画面へ移る。
// 画面から Supabase を直接呼ばない。/login と共有ページ（/q/...）では表示しない。
"use client";

import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { ApiError, fetchApi } from "@/components/fetch-api";
import { Spinner } from "@/components/ui/spinner";
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
    <div className="flex items-center gap-2 text-sm">
      {error && (
        <span
          role="alert"
          className="bg-danger/10 text-danger rounded-sm px-2 py-1 text-xs"
        >
          {error}
        </span>
      )}
      <button
        type="button"
        onClick={onLogout}
        disabled={busy}
        aria-label="ログアウト"
        className="border-line text-muted hover:border-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 whitespace-nowrap transition-colors"
      >
        {busy ? <Spinner /> : <LogOut aria-hidden className="size-4" />}
        <span className="hidden sm:inline">ログアウト</span>
      </button>
    </div>
  );
}
