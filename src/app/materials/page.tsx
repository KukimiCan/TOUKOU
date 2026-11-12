// front 担当のファイル（資料一覧の画面）。
// いまは仮データ（src/mocks/materials-preview.ts）で、科目ごとの資料一覧を表示する（#67）。
// 一覧の上で、板書を撮影・選んでアップロードできる（#66。いまは仮の動き）。
// API（/api/materials、/api/courses）につなぐのは #69。
import type { Metadata } from "next";

import { BoardUpload } from "@/components/board-upload";
import { MaterialsList } from "@/components/materials-list";
import {
  mockPreviewCourses,
  mockPreviewMaterials,
} from "@/mocks/materials-preview";

export const metadata: Metadata = {
  title: "資料 | TOUKOU",
};

export default function MaterialsPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-bold">資料</h1>
      <BoardUpload courses={mockPreviewCourses} />
      <MaterialsList
        materials={mockPreviewMaterials}
        courses={mockPreviewCourses}
      />
    </main>
  );
}
