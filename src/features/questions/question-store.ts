// back 担当のファイル。
// 問題の保存先（仮）。DB の questions テーブル（issue #5 / #30）ができるまで、メモリに保存する。
// サーバーを再起動すると消える。ユーザーごとに分けて、他人の問題が混ざらないようにする。
import type { Question } from "@/contracts/questions";

const questionsByUser = new Map<string, Question[]>();

export function listQuestions(userId: string, materialId?: string): Question[] {
  const all = questionsByUser.get(userId) ?? [];
  return materialId ? all.filter((q) => q.materialId === materialId) : all;
}

// AI の生成（#47）が問題を保存するときに使う
export function addQuestions(userId: string, questions: Question[]): void {
  questionsByUser.set(userId, [...listQuestions(userId), ...questions]);
}

// 公開する。すでに公開済みなら、同じ共有 URL（shareId）を返す。
// 見つからない（他人の問題も含む）ときは null
export function publishQuestion(userId: string, id: string): Question | null {
  const current = listQuestions(userId);
  const target = current.find((q) => q.id === id);
  if (!target) return null;
  if (target.isPublic && target.shareId) return target;

  // 推測されにくい長い文字列（32 文字の 16 進数）
  const published: Question = {
    ...target,
    isPublic: true,
    shareId: crypto.randomUUID().replace(/-/g, ""),
  };
  questionsByUser.set(
    userId,
    current.map((q) => (q.id === id ? published : q)),
  );
  return published;
}

// 共有 URL（shareId）から公開中の問題を探す。ログインは要らない。
// 公開していない問題や、無い shareId は null
export function findSharedQuestion(shareId: string): Question | null {
  for (const questions of questionsByUser.values()) {
    const found = questions.find((q) => q.isPublic && q.shareId === shareId);
    if (found) return found;
  }
  return null;
}
