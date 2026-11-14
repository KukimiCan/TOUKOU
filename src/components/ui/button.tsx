// front 担当のファイル。
// 共通のボタン。見た目を 3 種類にそろえ、処理中は回る印を出して二度押しを防ぐ。
// - primary：画面で一番大事な操作（墨色の塗り）
// - secondary：その次の操作（細い枠）
// - ghost：目立たせない操作（文字だけ）
import type { ComponentProps, ReactNode } from "react";

import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-foreground text-background hover:bg-foreground/85 disabled:hover:bg-foreground",
  secondary:
    "border border-line bg-surface text-foreground hover:border-foreground",
  ghost: "text-muted hover:text-foreground",
  danger: "border border-danger/40 text-danger hover:bg-danger/5",
};

// ボタンの見た目のクラス。リンクやラベルをボタンの見た目にしたいときにも使う
export function buttonClass(
  variant: ButtonVariant = "primary",
  className = "",
) {
  return `inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-sm px-4 py-2.5 text-sm font-semibold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent ${variants[variant]} ${className}`;
}

// ComponentProps<"button"> なので ref も渡せる（React 19）
type Props = ComponentProps<"button"> & {
  variant?: ButtonVariant;
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
      className={buttonClass(variant, className)}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}
