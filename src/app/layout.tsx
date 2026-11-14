import type { Metadata } from "next";
import { Barlow_Condensed, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";

import { SiteNav } from "@/components/site-nav";

// 本文と見出し：角ばった日本語の書体（明朝は使わない）
const body = Zen_Kaku_Gothic_New({
  variable: "--font-body",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

// ラベルと数字：細い英字の書体
const label = Barlow_Condensed({
  variable: "--font-label",
  weight: ["500", "600"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TOUKOU",
  description: "授業はスキップしても、学びはスキップしない。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${body.variable} ${label.variable} h-full antialiased`}
    >
      {/* 画面全体を端末の高さに収める。内容は上下のナビの間に置き、収まらないときだけ内容の部分がスクロールする */}
      <body className="flex h-dvh flex-col overflow-hidden">
        <Suspense fallback={null}>
          <SiteNav />
        </Suspense>
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-contain">
          {children}
        </div>
      </body>
    </html>
  );
}
