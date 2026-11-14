// front 担当のファイル（資料一覧の画面）。
// 科目ごとの資料一覧（#67）と、板書の撮影・アップロード（#66）。
// 資料と科目は API（/api/materials、/api/courses）から読み込む（#69）。読み込みは materials-screen.tsx（ブラウザで動く部品）が行う。
import type { Metadata } from "next";

import { MaterialsScreen } from "@/components/materials-screen";

import { MaterialsHeader } from "./materials-header";

export const metadata: Metadata = {
  title: "資料 | TOUKOU",
};

export default function MaterialsPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <MaterialsHeader />
      <MaterialsScreen />
    </main>
  );
}
