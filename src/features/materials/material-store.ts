// back 担当のファイル。
// 資料と画像の保存先（仮）。DB の materials テーブル（#4）と Storage（#29）ができるまで、メモリに保存する。
// サーバーを再起動すると消える。ユーザーごとに分けて、他人の資料や画像が混ざらないようにする。
// Storage に移すときは、画像の保存と読み出しの関数だけを差し替える。
import { randomUUID } from "node:crypto";

import type { Material, MaterialKind } from "@/contracts/materials";
import type { Explanation } from "@/lib/ai/explanation-schema";

export type StoredMaterial = {
  material: Material;
  // AI の解説。まだ作っていないときは null（生成は #47）
  explanation: Explanation | null;
};

export type StoredImage = { bytes: Uint8Array; mimeType: string };

const materialsByUser = new Map<string, StoredMaterial[]>();
const imagesByUser = new Map<string, Map<string, StoredImage>>();

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

// 画像を保存して資料を作る。作った資料を返す
export function addUploadedMaterial(
  userId: string,
  input: {
    courseId: string;
    kind: MaterialKind;
    bytes: Uint8Array;
    mimeType: string;
  },
): Material {
  const material: Material = {
    id: randomUUID(),
    courseId: input.courseId,
    kind: input.kind,
    createdAt: new Date().toISOString(),
    hasExplanation: false,
  };
  materialsByUser.set(userId, [
    ...(materialsByUser.get(userId) ?? []),
    { material, explanation: null },
  ]);

  const images = imagesByUser.get(userId) ?? new Map<string, StoredImage>();
  images.set(material.id, { bytes: input.bytes, mimeType: input.mimeType });
  imagesByUser.set(userId, images);
  return material;
}

// 元画像。他人の資料や無い ID は null
export function getImage(userId: string, id: string): StoredImage | null {
  return imagesByUser.get(userId)?.get(id) ?? null;
}

// 解説を保存する（作り直しのときは上書き）。資料が無いときは何もしない
export function setExplanation(
  userId: string,
  id: string,
  explanation: Explanation,
): void {
  const list = materialsByUser.get(userId) ?? [];
  materialsByUser.set(
    userId,
    list.map((item) =>
      item.material.id === id
        ? {
            ...item,
            explanation,
            material: { ...item.material, hasExplanation: true },
          }
        : item,
    ),
  );
}
