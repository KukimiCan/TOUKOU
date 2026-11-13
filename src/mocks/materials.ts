// 仮データ（架空）。形は src/contracts/materials.ts に合わせる。
// courseId は src/mocks/courses.ts の「プログラミング基礎（仮）」と同じ ID（ホームの短い復習と合わせる）。
// 解説の中身は AI 担当の仮データ（src/lib/ai/mocks/explanation.ts）を使う。
import type {
  GenerateMaterialResponse,
  Material,
  MaterialDetailResponse,
  MaterialsResponse,
} from "@/contracts/materials";
import { mockExplanation } from "@/lib/ai/mocks/explanation";

const mockCourseId = "00000000-0000-4000-8000-000000000002";

export const mockMaterials: Material[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    courseId: mockCourseId,
    kind: "board",
    createdAt: "2026-11-02T10:35:00+09:00",
    hasExplanation: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    courseId: mockCourseId,
    kind: "board",
    createdAt: "2026-11-02T10:36:00+09:00",
    hasExplanation: false,
  },
];

export const mockMaterialsResponse: MaterialsResponse = {
  materials: mockMaterials,
};

export const mockMaterialDetailResponse: MaterialDetailResponse = {
  material: mockMaterials[0],
  imageUrl: "https://example.com/mock/board.jpg",
  explanation: mockExplanation,
};

export const mockGenerateMaterialResponse: GenerateMaterialResponse = {
  explanation: mockExplanation,
  questionCount: 3,
};
