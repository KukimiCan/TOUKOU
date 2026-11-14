// front 担当のファイル。
// 全体のナビゲーション。
// - スマホ（幅 640px 未満）：上にブランドとログアウト、下に 4 つの項目（親指で押しやすい）
// - 広い画面：上に、ブランドと 4 つの項目、ログアウト
// 今いる画面を強調し、移動の途中は、押したリンクに細い線を出す。
// ログイン画面と共有ページ（/q/...）では出さない。
"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";

const items = [
  { href: "/", label: "ホーム" },
  { href: "/timetable", label: "時間割" },
  { href: "/materials", label: "資料" },
  { href: "/questions", label: "問題" },
] as const;

// 移動の途中に、リンクの端に細い線を出す
function PendingLine() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className="bg-accent absolute inset-x-2 top-0 h-0.5 origin-left"
      style={{
        opacity: pending ? 1 : 0,
        animation: pending ? "bar 900ms ease-out infinite alternate" : "none",
      }}
    />
  );
}

export function SiteNav() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname.startsWith("/q/")) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* 上の段：ブランドとログアウト（全幅） */}
      <header className="border-line bg-background/90 sticky top-0 z-20 border-b backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-2 sm:px-6">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-[0.18em]"
          >
            TOUKOU
          </Link>

          {/* 広い画面だけ、上の段に項目を並べる */}
          <nav aria-label="主なページ" className="hidden flex-1 sm:block">
            <ul className="flex items-center gap-1 text-sm">
              {items.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={isActive(href) ? "page" : undefined}
                    className={`relative block px-3 py-2 whitespace-nowrap transition-colors ${
                      isActive(href)
                        ? "text-foreground font-bold"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {label}
                    <PendingLine />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto">
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* スマホの下の段：4 つの項目を、画面の端に固定する */}
      <nav
        aria-label="主なページ（スマホ）"
        className="border-line bg-background/95 fixed inset-x-0 bottom-0 z-20 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {items.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`relative flex min-h-14 items-center justify-center text-sm transition-colors ${
                  isActive(href)
                    ? "text-foreground font-bold"
                    : "text-muted active:text-foreground"
                }`}
              >
                {label}
                <PendingLine />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
