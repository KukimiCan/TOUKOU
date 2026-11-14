// front 担当のファイル。
// 資料一覧を開いた直後の表示。画面と同じ枠・同じ見出しで骨格を出し、読み込み後に形が変わらないようにする。
import { MaterialsSkeleton } from "@/components/materials-screen";

export default function Loading() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <MaterialsSkeleton />
    </main>
  );
}
