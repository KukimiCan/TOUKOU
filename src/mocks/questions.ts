// 仮データ（架空）。形は src/contracts/questions.ts に合わせる。
// 問題文は微分の基本（#76 の板書解説の仮データと同じ話題）。
import type {
  AnswerResult,
  Question,
  QuestionsResponse,
  SharedQuestion,
} from "@/contracts/questions";

const materialId = "00000000-0000-4000-8000-000000000101";

export const mockQuestions: Question[] = [
  {
    id: "00000000-0000-4000-8000-000000000201",
    materialId,
    prompt: "関数 f(x) = x² の x = 1 における微分係数はいくつか。",
    choices: ["1", "2", "3", "4"],
    answerIndex: 1,
    explanation:
      "f'(x) = 2x なので、f'(1) = 2。平均変化率の極限として求められる。",
    isPublic: true,
    shareId: "mock-share-id-0000000001",
    createdAt: "2026-11-02T11:00:00+09:00",
  },
  {
    id: "00000000-0000-4000-8000-000000000202",
    materialId,
    prompt: "平均変化率の式として正しいものはどれか。",
    choices: [
      "(f(a+h) - f(a)) / h",
      "f(a) / h",
      "f'(a)",
      "h / (f(a+h) - f(a))",
    ],
    answerIndex: 0,
    explanation: "平均変化率は、x の増加量 h に対する y の増加量の比。",
    isPublic: false,
    shareId: null,
    createdAt: "2026-11-02T11:05:00+09:00",
  },
];

export const mockQuestionsResponse: QuestionsResponse = {
  questions: mockQuestions,
};

// 共有された問題（回答前。正解と解説は含まない）
export const mockSharedQuestion: SharedQuestion = {
  shareId: "mock-share-id-0000000001",
  prompt: mockQuestions[0].prompt,
  choices: mockQuestions[0].choices,
};

// 回答の結果（正解の例）
export const mockAnswerResult: AnswerResult = {
  correct: true,
  correctIndex: 1,
  explanation: mockQuestions[0].explanation,
};
