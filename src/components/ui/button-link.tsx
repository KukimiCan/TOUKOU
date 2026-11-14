// front 担当のファイル。
// ボタンの見た目のリンク。画面の移動はボタンではなくリンクで行う（押すと移動先を先読みして速く開く）。
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { buttonClass, type ButtonVariant } from "./button";

type Props = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  // 文字の前に置くアイコン（lucide-react）
  icon?: ReactNode;
};

export function ButtonLink({
  variant = "primary",
  icon,
  className = "",
  children,
  ...rest
}: Props) {
  return (
    <Link {...rest} className={buttonClass(variant, className)}>
      {icon}
      {children}
    </Link>
  );
}
