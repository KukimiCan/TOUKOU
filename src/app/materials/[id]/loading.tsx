// front 担当のファイル。
// 資料の詳細を開いた直後の表示。画面と同じ枠で骨格を出し、読み込み後に形が変わらないようにする。
import { MaterialDetailSkeleton } from "@/components/material-detail-screen";

export default function Loading() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <MaterialDetailSkeleton />
    </main>
  );
}
