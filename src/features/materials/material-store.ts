// back 担当のファイル。
// 資料・元画像・AI の解説の保存先。
// - 資料：DB の materials テーブル（RLS で本人の行だけ読み書きできる）
// - 元画像：非公開の Storage（materials バケット）。置き場所は「<ユーザーの ID>/<資料の ID>.<拡張子>」で、本人だけが読める
// - AI の解説：DB の material_notes テーブル。要約（summary）は文章のまま、解説の全体（explanation）は JSON の文字列で入れる
// 列名（snake_case）と契約の名前（camelCase）の変換はこのファイルで行う。
import { randomUUID } from "node:crypto";

import type { Material, MaterialKind } from "@/contracts/materials";
import {
  type Explanation,
  explanationSchema,
} from "@/lib/ai/explanation-schema";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type StoredMaterial = {
  material: Material;
  // AI の解説。まだ作っていないときは null（生成は #47）
  explanation: Explanation | null;
};

export type StoredImage = { bytes: Uint8Array; mimeType: string };

type MaterialRow = Database["public"]["Tables"]["materials"]["Row"];
type NoteInsert = Database["public"]["Tables"]["material_notes"]["Insert"];

const BUCKET = "materials";

// 画像の種類と、Storage に置くときの拡張子
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function toMaterial(row: MaterialRow, hasExplanation: boolean): Material {
  return {
    id: row.id,
    courseId: row.course_id,
    kind: row.kind as MaterialKind,
    // DB の日時（例: 2026-11-13T13:43:50.83+00:00）を、契約の形にそろえる
    createdAt: new Date(row.created_at).toISOString(),
    hasExplanation,
  };
}

// 保存してある解説（JSON の文字列）を読む。壊れていて読めないときは「まだ無い」として扱う
function parseExplanation(body: string | undefined): Explanation | null {
  if (body === undefined) return null;
  try {
    const parsed = explanationSchema.safeParse(JSON.parse(body));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function listMaterials(
  userId: string,
  courseId?: string,
): Promise<Material[]> {
  const supabase = await createClient();
  let query = supabase
    .from("materials")
    .select("*, material_notes(kind)")
    .eq("user_id", userId)
    .order("created_at");
  if (courseId) query = query.eq("course_id", courseId);

  const { data, error } = await query;
  if (error) throw error;
  return data.map((row) =>
    toMaterial(
      row,
      row.material_notes.some((note) => note.kind === "explanation"),
    ),
  );
}

// 見つからない（他人の資料も含む）ときは null。RLS で他人の行は見えない
export async function getMaterial(
  userId: string,
  id: string,
): Promise<StoredMaterial | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materials")
    .select("*, material_notes(kind, body)")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const explanation = parseExplanation(
    data.material_notes.find((note) => note.kind === "explanation")?.body,
  );
  return { material: toMaterial(data, explanation !== null), explanation };
}

// 画像を Storage に保存して資料を作る。作った資料を返す
export async function addUploadedMaterial(
  userId: string,
  input: {
    courseId: string;
    kind: MaterialKind;
    bytes: Uint8Array;
    mimeType: string;
  },
): Promise<Material> {
  const supabase = await createClient();
  const id = randomUUID();
  const path = `${userId}/${id}.${EXTENSIONS[input.mimeType] ?? "bin"}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, input.bytes, { contentType: input.mimeType });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("materials")
    .insert({
      id,
      user_id: userId,
      course_id: input.courseId,
      kind: input.kind,
      storage_path: path,
    })
    .select("*")
    .single();
  if (error) {
    // 資料の行を作れなかったら、画像だけが残らないように消す
    await supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }
  return toMaterial(data, false);
}

// 元画像。他人の資料や無い ID は null
export async function getImage(
  userId: string,
  id: string,
): Promise<StoredImage | null> {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("materials")
    .select("storage_path")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!row) return null;

  const { data: blob, error: downloadError } = await supabase.storage
    .from(BUCKET)
    .download(row.storage_path);
  if (downloadError) throw downloadError;

  // 画像の種類は Storage が覚えている。分からないときは拡張子から決める
  const extension = row.storage_path.split(".").pop();
  const mimeType =
    blob.type ||
    Object.keys(EXTENSIONS).find((type) => EXTENSIONS[type] === extension) ||
    "application/octet-stream";
  return { bytes: new Uint8Array(await blob.arrayBuffer()), mimeType };
}

// 解説を保存する（作り直しのときは入れ替える）。資料が無い（他人の資料も含む）ときは何もしない
export async function setExplanation(
  userId: string,
  id: string,
  explanation: Explanation,
): Promise<void> {
  const supabase = await createClient();
  const { data: material, error } = await supabase
    .from("materials")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!material) return;

  // 先に新しい解説を入れてから古いものを消す（途中で失敗しても、解説が無い状態にならない）
  const { data: oldNotes, error: oldError } = await supabase
    .from("material_notes")
    .select("id")
    .eq("material_id", id);
  if (oldError) throw oldError;

  const notes: NoteInsert[] = [
    { material_id: id, kind: "explanation", body: JSON.stringify(explanation) },
  ];
  // 要約は、解説を全部読まなくても使えるように別の行にも入れる（本文が空の行は作れない）
  if (explanation.summary.trim() !== "") {
    notes.push({
      material_id: id,
      kind: "summary",
      body: explanation.summary,
    });
  }
  const { error: insertError } = await supabase
    .from("material_notes")
    .insert(notes);
  if (insertError) throw insertError;

  if (oldNotes.length > 0) {
    const { error: deleteError } = await supabase
      .from("material_notes")
      .delete()
      .in(
        "id",
        oldNotes.map((note) => note.id),
      );
    if (deleteError) throw deleteError;
  }
}

// 資料の要約（material_notes の kind='summary' の本文）。無いときは null
export async function getSummary(materialId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("material_notes")
    .select("body")
    .eq("material_id", materialId)
    .eq("kind", "summary")
    .maybeSingle();
  if (error) throw error;
  return data?.body ?? null;
}
