// 仮データ（架空）。資料一覧（/materials）の見た目と、科目での絞り込みを確かめるためのもの。
// 形は src/contracts/materials.ts と src/contracts/courses.ts に合わせる。
// - 資料は、src/mocks/materials.ts の 2 件に、別の科目・種類・解説の有無を足した 5 件
// - 科目は、src/mocks/courses.ts の 2 科目に、資料がまだ無い科目を 1 つ足した 3 科目
// - 資料の詳細（/materials/[id]）は mockPreviewMaterialDetail で作る。画像は public/mocks/ の架空の板書
import type { Course } from "@/contracts/courses";
import type { Material, MaterialDetailResponse } from "@/contracts/materials";
import { mockExplanation } from "@/lib/ai/mocks/explanation";
import { mockCourses } from "@/mocks/courses";
import { mockMaterials } from "@/mocks/materials";

export const mockPreviewCourses: Course[] = [
  ...mockCourses,
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "英語（仮）",
    dayOfWeek: "thu",
    period: 2,
  },
];

export const mockPreviewMaterials: Material[] = [
  ...mockMaterials,
  {
    id: "00000000-0000-4000-8000-000000000103",
    courseId: "00000000-0000-4000-8000-000000000001",
    kind: "slide",
    createdAt: "2026-10-26T10:40:00+09:00",
    hasExplanation: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000104",
    courseId: "00000000-0000-4000-8000-000000000002",
    kind: "board",
    createdAt: "2026-11-04T14:50:00+09:00",
    hasExplanation: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000105",
    courseId: "00000000-0000-4000-8000-000000000002",
    kind: "slide",
    createdAt: "2026-10-28T13:05:00+09:00",
    hasExplanation: false,
  },
];

// 資料の詳細の仮データ。見つからない ID のときは null。
// 解説は、解説を作り終えた資料（hasExplanation が true）にだけ付ける
export function mockPreviewMaterialDetail(
  id: string,
): MaterialDetailResponse | null {
  const material = mockPreviewMaterials.find((m) => m.id === id);
  if (!material) return null;
  return {
    material,
    // 本物の API は https:// から始まる一時 URL を返す。仮データは手元の画像なので、同じサーバーのパスにする
    imageUrl: "/mocks/board-sample.svg",
    explanation: material.hasExplanation ? mockExplanation : null,
  };
}
