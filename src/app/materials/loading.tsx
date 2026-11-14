// front 担当のファイル。
// 資料一覧を開いた直後の表示。画面と同じ幅・同じ見出しで骨格を出し、読み込み後に形が変わらないようにする。
import { MaterialsSkeleton } from "@/components/materials-screen";

import { MaterialsHeader } from "./materials-header";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <MaterialsHeader />
      <MaterialsSkeleton />
    </main>
  );
}
