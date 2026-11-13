// back 担当のファイル。
// 資料の保存先（仮）。DB の materials テーブル（issue #4）ができるまで、メモリに保存する。
// サーバーを再起動すると消える。ユーザーごとに分けて、他人の資料が混ざらないようにする。
import type { Material } from "@/contracts/materials";
import type { Explanation } from "@/lib/ai/explanation-schema";

export type StoredMaterial = {
  material: Material;
  // 元の画像を見るための URL（Storage の一時 URL。#29 / #45 で入れる）
  imageUrl: string;
  // AI の解説。まだ作っていないときは null（生成は #47）
  explanation: Explanation | null;
};

const materialsByUser = new Map<string, StoredMaterial[]>();

export function listMaterials(userId: string, courseId?: string): Material[] {
  const all = (materialsByUser.get(userId) ?? []).map((item) => item.material);
  return courseId ? all.filter((m) => m.courseId === courseId) : all;
}

// 見つからない（他人の資料も含む）ときは null
export function getMaterial(userId: string, id: string): StoredMaterial | null {
  return (
    (materialsByUser.get(userId) ?? []).find(
      (item) => item.material.id === id,
    ) ?? null
  );
}

export function addMaterial(userId: string, item: StoredMaterial): void {
  materialsByUser.set(userId, [...(materialsByUser.get(userId) ?? []), item]);
}
