// 共有ファイル（front と back の約束）。変更するときは front と back の両方にレビューしてもらう。
// 資料・板書（アップロード、一覧、詳細、AI 生成）の入出力の形を zod で定義する。
import { z } from "zod";

// AI の解説の形は AI 担当の src/lib/ai/explanation-schema.ts が正本。ここでは同じものを使う
import { explanationSchema } from "@/lib/ai/explanation-schema";

// 資料の種類。board = 板書の写真、slide = スライド・配布資料の写真
export const materialKindSchema = z.enum(["board", "slide"]);

// アップロードできる画像。Vercel の 1 回の送信の上限（4.5 MB）より少し小さくする
export const MATERIAL_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const MATERIAL_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

export const materialSchema = z.object({
  id: z.uuid(),
  courseId: z.uuid(),
  kind: materialKindSchema,
  createdAt: z.iso.datetime({ offset: true }),
  // AI の解説を作り終えているとき true
  hasExplanation: z.boolean(),
});

// アップロード（POST /api/materials）は multipart/form-data で送る。
// 画像は "file" に入れる。画像以外の項目はこの形
export const uploadMaterialFieldsSchema = z.object({
  courseId: z.uuid(),
  kind: materialKindSchema.default("board"),
});

export const materialResponseSchema = z.object({ material: materialSchema });

// 一覧（GET /api/materials?courseId=...）。courseId を付けるとその科目だけ
export const listMaterialsQuerySchema = z.object({
  courseId: z.uuid().optional(),
});
export const materialsResponseSchema = z.object({
  materials: z.array(materialSchema),
});

// 詳細（GET /api/materials/[id]）
export const materialDetailResponseSchema = z.object({
  material: materialSchema,
  // 元の画像を見るための一時 URL（しばらくすると開けなくなる）
  imageUrl: z.url(),
  // まだ AI の解説を作っていないときは null
  explanation: explanationSchema.nullable(),
});

// AI 生成（POST /api/materials/[id]/generate）。送る中身は無し
export const generateMaterialResponseSchema = z.object({
  explanation: explanationSchema,
  // 作って保存した確認問題の数（問題の中身は /api/questions で取る）
  questionCount: z.number().int().min(0),
});

export type MaterialKind = z.infer<typeof materialKindSchema>;
export type Material = z.infer<typeof materialSchema>;
export type UploadMaterialFields = z.infer<typeof uploadMaterialFieldsSchema>;
export type MaterialResponse = z.infer<typeof materialResponseSchema>;
export type MaterialsResponse = z.infer<typeof materialsResponseSchema>;
export type MaterialDetailResponse = z.infer<
  typeof materialDetailResponseSchema
>;
export type GenerateMaterialResponse = z.infer<
  typeof generateMaterialResponseSchema
>;
