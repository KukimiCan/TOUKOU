// front 担当のファイル。
// 全体のナビゲーション。現在の画面を強調し、移動の途中はリンクに細い線を出す。
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

// 移動の途中に、リンクの下に細い線を出す
function PendingLine() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className="bg-accent absolute inset-x-2 -bottom-px h-0.5 origin-left transition-opacity"
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

  return (
    <header className="border-line bg-background/90 sticky top-0 z-20 border-b backdrop-blur">
      <nav
        aria-label="主なページ"
        className="mx-auto flex w-full max-w-5xl items-center gap-1 px-4 py-2 sm:gap-2 sm:px-6"
      >
        <Link
          href="/"
          className="font-display mr-3 text-xl font-semibold tracking-[0.18em]"
        >
          TOUKOU
        </Link>

        <ul className="flex flex-1 items-center gap-1 overflow-x-auto text-sm">
          {items.map(({ href, label }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative block px-3 py-1.5 whitespace-nowrap transition-colors ${
                    active
                      ? "text-foreground font-bold"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                  <PendingLine />
                </Link>
              </li>
            );
          })}
        </ul>

        <LogoutButton />
      </nav>
    </header>
  );
}
