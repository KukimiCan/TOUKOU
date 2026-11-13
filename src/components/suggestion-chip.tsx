// front 担当のファイル。
// ホームの「空き時間の過ごし方」と「短い復習」の見出しの先頭に付ける、小さな「提案」のチップ（#64）。
// アプリからの提案であることが一目で分かるようにする。
// 色は電球に合わせた黄色系（急ぐときの赤とは分ける）。暗い画面では、背景を暗く・文字を明るくする。
export function SuggestionChip() {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-amber-100 py-0.5 pr-2 pl-1.5 text-xs leading-none font-semibold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
      <BulbIcon />
      提案
    </span>
  );
}

// 電球のマーク。アイコンはライブラリを増やさないよう SVG を直接書く
function BulbIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18h6" />
      <path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z" />
    </svg>
  );
}
