// front 担当のファイル。
// 共通のモーダル。スマホは下から出るシート、広い画面は中央の窓。
// - 閉じる：右上の × ボタン、Esc キー、背景を押す
// - 開いている間は、後ろの画面を操作できない（ブラウザの <dialog> の showModal を使う）
// - 中身が長いときは、モーダルの中だけがスクロールする
"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  // 下に固定する操作（保存・キャンセルなど）
  footer?: ReactNode;
};

export function Modal({ open, onClose, title, children, footer }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        // 背景（dialog そのもの）を押したら閉じる
        if (e.target === ref.current) onClose();
      }}
      className="bg-surface text-foreground backdrop:bg-foreground/40 fixed inset-x-0 top-auto bottom-0 m-0 w-full max-w-none rounded-t-sm border-0 p-0 transition-[opacity,translate] duration-200 backdrop:backdrop-blur-[2px] open:translate-y-0 open:opacity-100 sm:inset-0 sm:m-auto sm:h-fit sm:w-[min(32rem,calc(100%-2rem))] sm:rounded-sm starting:open:translate-y-6 starting:open:opacity-0"
    >
      <div className="flex max-h-[85dvh] flex-col pb-[env(safe-area-inset-bottom)]">
        <header className="border-line flex shrink-0 items-center justify-between gap-3 border-b py-2 pr-2 pl-5">
          <h2 id={titleId} className="text-base">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="text-muted hover:text-foreground inline-flex size-11 items-center justify-center"
          >
            <X aria-hidden className="size-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
        {footer && (
          <footer className="border-line flex shrink-0 justify-end gap-2 border-t px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </dialog>
  );
}
