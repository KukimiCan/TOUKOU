// front 担当のファイル。
// 読み込み中の回る印。文字と一緒に使い、画面の読み上げにも状態を伝える。
import { LoaderCircle } from "lucide-react";

export function Spinner({
  label,
  className = "size-4",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <>
      <LoaderCircle aria-hidden className={`${className} animate-spin`} />
      {label && <span className="sr-only">{label}</span>}
    </>
  );
}
