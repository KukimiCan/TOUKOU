// front 担当のファイル。
// 画面の読み込み中に出す骨格。内容が来るまで、画面の形を先に見せる（待ちを短く感じさせる）。
// width：画面の幅に合わせる（読み込み後に幅が跳ねないように）
export function PageSkeleton({
  rows = 3,
  width = "max-w-5xl",
}: {
  rows?: number;
  width?: "max-w-xl" | "max-w-3xl" | "max-w-5xl";
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`mx-auto flex w-full ${width} flex-col gap-6 px-4 py-10 sm:px-6`}
    >
      <span className="sr-only">読み込み中です</span>
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-4 w-72 max-w-full" />
      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="skeleton h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
