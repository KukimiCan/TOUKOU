// front 担当のファイル。
// ホームを開くときの読み込み中の表示。ホームと同じ幅・同じ形の骨格を出し、表示に切り替わったときに形が跳ねないようにする。
import { HomeSkeleton } from "@/components/home-content";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div aria-hidden className="flex flex-col gap-2">
        <div className="skeleton h-4 w-36" />
        <div className="skeleton h-4 w-64 max-w-full" />
      </div>
      <HomeSkeleton />
    </div>
  );
}
