// front 担当のファイル。
// 資料の詳細を開いた直後の表示。画面と同じ幅で骨格を出し、読み込み後に形が変わらないようにする。
import { MaterialDetailSkeleton } from "@/components/material-detail-screen";

import { BackToMaterials } from "./back-link";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <BackToMaterials />
      <MaterialDetailSkeleton />
    </main>
  );
}
