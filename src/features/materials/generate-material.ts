// back 担当のファイル。
// 資料の AI 生成：画像から解説を作り、解説から確認問題を作って保存する。
// 保存した問題は materialId で元の資料をたどれる。
// AI_PROVIDER=mock のときは AI を呼ばず、仮の結果を返す。
import { randomUUID } from "node:crypto";

import type { Question } from "@/contracts/questions";
import { isMockAi } from "@/lib/ai";
import { explainBoard } from "@/lib/ai/explain-board";
import type { Explanation } from "@/lib/ai/explanation-schema";
import { generateQuestions } from "@/lib/ai/generate-questions";
import { replaceQuestionsForMaterial } from "@/features/questions/question-store";

import {
  getImage,
  getMaterial,
  setExplanation,
} from "@/features/materials/material-store";

// 解説を、確認問題を作るための本文にする
function explanationToText(explanation: Explanation): string {
  return [
    explanation.summary,
    ...explanation.terms.map((t) => `${t.term}: ${t.meaning}`),
    ...explanation.formulas.map((f) => `${f.formula}: ${f.explanation}`),
    ...explanation.omissions.map((o) => `${o.topic}: ${o.explanation}`),
  ].join("\n");
}

// 作れたら結果を返す。資料が無い（他人の資料も含む）ときは null。
// AI の失敗は例外として投げる（呼び出し側で 502 を返す）。
export async function generateMaterial(
  userId: string,
  id: string,
): Promise<{ explanation: Explanation; questionCount: number } | null> {
  const item = await getMaterial(userId, id);
  if (!item) return null;
  // mock のときは画像を読まない。本物のときは保存した元画像を読む
  const image = isMockAi()
    ? new Uint8Array()
    : ((await getImage(userId, id))?.bytes ?? new Uint8Array());

  const explanation = await explainBoard(image);
  const generated = await generateQuestions(explanationToText(explanation));

  const now = new Date().toISOString();
  const questions: Question[] = generated.map((q) => ({
    ...q,
    id: randomUUID(),
    materialId: id,
    isPublic: false,
    shareId: null,
    createdAt: now,
  }));

  await setExplanation(userId, id, explanation);
  await replaceQuestionsForMaterial(userId, id, questions);
  return { explanation, questionCount: questions.length };
}
