// back 担当のファイル。
// 空き時間に勧める復習の資料を選ぶ。DB を使わない計算だけの関数。
//
// 選び方（決めたこと）:
// 1. 次の授業の科目の資料を優先する
// 2. 同じ科目の中では、作成日時が新しいものを選ぶ（直近の授業の内容を先に復習する）
// 3. その科目の資料が無いときは、別の科目の資料は選ばない（null）。呼び出し側は休憩などを提案する
//
// 資料の型は本体（#44 の contracts）に依存させず、必要な項目だけ持つ。

export type ReviewSource = {
  materialId: string;
  courseId: string;
  createdAt: Date;
};

export function pickReviewMaterial(
  nextCourseId: string | null,
  materials: ReviewSource[],
): ReviewSource | null {
  // 次の授業が無いときは復習を選ばない
  if (nextCourseId === null) return null;

  let best: ReviewSource | null = null;
  for (const material of materials) {
    if (material.courseId !== nextCourseId) continue;
    if (!best || material.createdAt > best.createdAt) best = material;
  }
  return best;
}
