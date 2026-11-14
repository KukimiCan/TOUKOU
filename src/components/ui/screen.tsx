// front 担当のファイル。
// 画面の枠。画面は「スクロールしない」作りを基本にする。
// - 上：小さなラベルと見出し、右に画面の操作
// - 下：内容。端末の高さいっぱいに収まる。長い一覧は ScrollArea の中だけでスクロールする
import type { ReactNode } from "react";

type Props = {
  // 見出しの上の小さなラベル（例：TODAY）。文字でも、部品（日付など）も渡せる
  label?: ReactNode;
  // ラベルの見た目。en は英字の小見出し（大文字・字間を広げる）、ja は日本語の補足（小さく、大文字にしない）
  labelStyle?: "en" | "ja";
  title: string;
  // 見出しを読み上げだけにする（ナビと重複して見た目には要らないとき）
  hideTitle?: boolean;
  // 見出しの右に置く操作（追加ボタンなど）
  actions?: ReactNode;
  width?: "max-w-xl" | "max-w-3xl" | "max-w-5xl";
  children: ReactNode;
};

export function Screen({
  label,
  title,
  hideTitle = false,
  actions,
  width = "max-w-xl",
  labelStyle = "en",
  children,
}: Props) {
  return (
    <div
      className={`mx-auto flex min-h-0 w-full ${width} flex-1 flex-col gap-4 px-4 pt-5 pb-4 sm:px-6`}
    >
      <header className="flex shrink-0 items-end justify-between gap-3">
        <div className="min-w-0">
          {label && (
            <p
              className={
                labelStyle === "en"
                  ? "font-display text-muted text-xs tracking-[0.2em] uppercase"
                  : "text-muted text-xs tabular-nums"
              }
            >
              {label}
            </p>
          )}
          <h1 className={hideTitle ? "sr-only" : "truncate text-xl"}>
            {title}
          </h1>
        </div>
        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-4">{children}</div>
    </div>
  );
}

// 長い一覧を、画面の中の決まった場所だけでスクロールさせる
export function ScrollArea({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${className}`}
    >
      {children}
    </div>
  );
}
