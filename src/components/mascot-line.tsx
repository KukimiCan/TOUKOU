// front 担当のファイル。
// キャラクターと台詞（吹き出し）。台詞は 1〜2 行の短いものにする。使う場面は docs/design.md の「キャラクター」。
// 台詞は文字として読み上げる（キャラクターの絵は装飾として読み上げから外す）。
import type { ReactNode } from "react";

import { Mascot, type MascotExpression } from "./mascot";

export function MascotLine({
  expression,
  children,
  size = 72,
  bob = false,
  className = "",
}: {
  expression: MascotExpression;
  children: ReactNode;
  size?: number;
  bob?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Mascot expression={expression} size={size} bob={bob} decorative />
      <p className="border-line bg-surface relative min-w-0 rounded-md border px-3 py-2 text-sm leading-snug font-semibold text-pretty [word-break:auto-phrase]">
        {/* 吹き出しのしっぽ（キャラクターの側） */}
        <span
          aria-hidden
          className="border-line bg-surface absolute top-1/2 -left-[6px] size-2.5 -translate-y-1/2 rotate-45 border-b border-l"
        />
        {children}
      </p>
    </div>
  );
}
