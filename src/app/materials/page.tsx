// front 担当のファイル（資料一覧の画面）。
// 科目ごとの資料一覧（#67）と、板書の撮影・アップロード（#66）。
// 資料と科目は API（/api/materials、/api/courses）から読み込む（#69）。読み込みは materials-screen.tsx（ブラウザで動く部品）が行う。
import type { Metadata } from "next";

import { Suspense } from "react";

import {
  MaterialsScreen,
  MaterialsSkeleton,
} from "@/components/materials-screen";

export const metadata: Metadata = {
  title: "資料 | TOUKOU",
};

export default function MaterialsPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      {/* 検索パラメータ（?course=）を読むため Suspense で包む */}
      <Suspense fallback={<MaterialsSkeleton />}>
        <MaterialsScreen />
      </Suspense>
    </main>
  );
}
