// 仮データ（架空）。問題の確認・公開（/questions）の見た目を確かめるためのもの。
// 形は src/contracts/questions.ts に合わせる。
// - 問題は、src/mocks/questions.ts の 2 問（公開済み 1 問、未公開 1 問）に、未公開の 1 問を足した 3 問
import type { Question } from "@/contracts/questions";
import { mockQuestions } from "@/mocks/questions";

export const mockPreviewQuestions: Question[] = [
  ...mockQuestions,
  {
    id: "00000000-0000-4000-8000-000000000203",
    materialId: "00000000-0000-4000-8000-000000000102",
    prompt: "導関数 f'(x) は何を表すか。",
    choices: [
      "各点での接線の傾き",
      "グラフと x 軸で囲まれた面積",
      "関数の最大値",
    ],
    answerIndex: 0,
    explanation:
      "導関数は、各点 x での微分係数（瞬間の変化率）を返す関数。グラフでは、その点での接線の傾きにあたる。",
    isPublic: false,
    shareId: null,
    createdAt: "2026-11-04T15:00:00+09:00",
  },
];
