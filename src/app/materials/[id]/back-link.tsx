// front 担当のファイル。
// 資料の一覧へ戻るリンク。画面（page.tsx）と読み込み中（loading.tsx）で同じものを出す。
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function BackToMaterials() {
  return (
    <Link
      href="/materials"
      className="text-muted hover:text-foreground -ml-1 inline-flex items-center gap-1.5 self-start px-1 text-sm whitespace-nowrap transition-colors"
    >
      <ArrowLeft aria-hidden className="size-4" />
      資料の一覧
    </Link>
  );
}
