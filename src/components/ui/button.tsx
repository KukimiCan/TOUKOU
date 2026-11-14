// front 担当のファイル。
// 共通のボタン。見た目を 3 種類にそろえ、処理中は回る印を出して二度押しを防ぐ。
// - primary：画面で一番大事な操作（墨色の塗り）
// - secondary：その次の操作（細い枠）
// - ghost：目立たせない操作（文字だけ）
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { Spinner } from "./spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-foreground text-background hover:bg-foreground/85 disabled:hover:bg-foreground",
  secondary:
    "border border-line bg-surface text-foreground hover:border-foreground",
  ghost: "text-muted hover:text-foreground",
  danger: "border border-danger/40 text-danger hover:bg-danger/5",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  // 処理中。回る印を出して、押せないようにする
  loading?: boolean;
  // 文字の前に置くアイコン（lucide-react）
  icon?: ReactNode;
};

export function Button({
  variant = "primary",
  loading = false,
  icon,
  disabled,
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold ${variants[variant]} ${className}`}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}
