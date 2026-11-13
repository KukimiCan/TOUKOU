// 仮データ（架空）。共有ページ（/q/[shareId]）の見た目と、回答の動きを確かめるためのもの。
// 形は src/contracts/questions.ts に合わせる。
// - 問題は src/mocks/questions.ts のうち、公開済みのもの（共有 ID: mock-share-id-0000000001）
// - 本物の API と同じく、共有の見え方には正解と解説を入れず、回答したときに初めて返す
import type { AnswerResult, SharedQuestion } from "@/contracts/questions";
import { mockQuestions } from "@/mocks/questions";

function findPublic(shareId: string) {
  return mockQuestions.find((q) => q.isPublic && q.shareId === shareId);
}

// 共有された問題（回答前）。見つからない・公開されていないときは null
export function mockPreviewSharedQuestion(
  shareId: string,
): SharedQuestion | null {
  const question = findPublic(shareId);
  if (!question?.shareId) return null;
  return {
    shareId: question.shareId,
    prompt: question.prompt,
    choices: question.choices,
  };
}

// 回答の結果。選んだ番号から、正解・不正解のどちらも確かめられる
export function mockPreviewAnswer(
  shareId: string,
  choiceIndex: number,
): AnswerResult | null {
  const question = findPublic(shareId);
  if (!question) return null;
  return {
    correct: choiceIndex === question.answerIndex,
    correctIndex: question.answerIndex,
    explanation: question.explanation,
  };
}
