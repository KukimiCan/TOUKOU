// back 担当のファイル。
// 回答の保存先（仮）。DB の answers テーブル（issue #32）ができるまで、メモリに保存する。
// 共有ページはログインが要らないので、回答は誰が送ったかを分けずに問題ごとに溜める。
import type { AnswerResult } from "@/contracts/questions";

type StoredAnswer = { shareId: string; choiceIndex: number; correct: boolean };

// 溜める回答の数の上限。超えたら古いものから捨てる（メモリが増え続けないように。#154）。
// 連投そのものは、保存の前に route が answer-rate-limit.ts で止める
const MAX_STORED_ANSWERS = 10_000;

const answers: StoredAnswer[] = [];

export function saveAnswer(
  shareId: string,
  choiceIndex: number,
  correct: boolean,
): void {
  answers.push({ shareId, choiceIndex, correct });
  if (answers.length > MAX_STORED_ANSWERS) {
    answers.splice(0, answers.length - MAX_STORED_ANSWERS);
  }
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
