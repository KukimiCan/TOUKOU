// front 担当のファイル。
// ホームの「空き時間の過ごし方」と「短い復習」の、要約の行（#64）。
// ホームは 1 画面に収めるので、提案は短い要約（2 行まで）だけを出し、押すとモーダルで全部を出す。
// - 上の小さな行：何の提案か（ラベル）と、時刻や件数（数字は font-display）
// - 下の行：中身の要約。長いときは 2 行で切って「…」にする
// 行全体が 1 つのボタン。右端の矢印で、押すと詳しく見られることを伝える。
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  // 左に置くアイコン（lucide-react）。行の種類を見分けやすくする
  icon: ReactNode;
  // 例：「空き時間の過ごし方」
  label: string;
  // ラベルの右に添える数字（時刻や件数）
  meta?: ReactNode;
  // 短い要約（2 行まで）
  summary: ReactNode;
  onOpen: () => void;
};

export function SuggestionRow({ icon, label, meta, summary, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      className="group hover:bg-surface flex w-full items-center gap-3 px-5 py-3 text-left"
    >
      <span className="text-accent shrink-0 [&_svg]:size-5">{icon}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-muted flex items-baseline gap-2 text-xs font-semibold whitespace-nowrap">
          {label}
          {meta && (
            <span className="font-display text-sm tracking-wide tabular-nums">
              {meta}
            </span>
          )}
        </span>
        <span className="line-clamp-2 text-[0.9375rem] leading-snug [word-break:auto-phrase]">
          {summary}
        </span>
      </span>
      <ChevronRight
        aria-hidden
        className="text-muted group-hover:text-foreground size-5 shrink-0 transition-[color,translate] duration-200 group-hover:translate-x-0.5"
      />
    </button>
  );
}
