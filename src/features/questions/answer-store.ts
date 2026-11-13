// back 担当のファイル。
// 回答の保存先（仮）。DB の answers テーブル（issue #32）ができるまで、メモリに保存する。
// 共有ページはログインが要らないので、回答は誰が送ったかを分けずに問題ごとに溜める。
import type { AnswerResult } from "@/contracts/questions";

type StoredAnswer = { shareId: string; choiceIndex: number; correct: boolean };

const answers: StoredAnswer[] = [];

export function saveAnswer(
  shareId: string,
  choiceIndex: number,
  correct: boolean,
): void {
  answers.push({ shareId, choiceIndex, correct });
}

// 正誤と解説を作る。問題の正解は呼び出し側から渡す（この関数は保存だけ）
export function answerResultFor(
  question: { answerIndex: number; explanation: string },
  choiceIndex: number,
): AnswerResult {
  return {
    correct: choiceIndex === question.answerIndex,
    correctIndex: question.answerIndex,
    explanation: question.explanation,
  };
}
