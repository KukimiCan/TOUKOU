// front 担当のファイル。
// ホームの「空き時間の過ごし方」と「短い復習」の見出しの先頭に付ける、小さな「提案」のチップ（#64）。
// アプリからの提案であることが一目で分かるようにする。
// 色はアクセント（琥珀色）。急ぐときの色（text-danger）とは分ける。
import { Lightbulb } from "lucide-react";

export function SuggestionChip() {
  return (
    <span className="bg-accent-soft text-accent inline-flex shrink-0 items-center gap-1 rounded-sm py-0.5 pr-2 pl-1.5 text-xs leading-none font-semibold whitespace-nowrap">
      <Lightbulb aria-hidden className="size-3.5" />
      提案
    </span>
  );
}
