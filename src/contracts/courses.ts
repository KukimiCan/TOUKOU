// 共有ファイル（front と back の約束）。変更するときは front と back の両方にレビューしてもらう。
// 時間割の科目の形を zod で定義する。API のキーは英語（mon〜sun）、画面の表示は front が日本語にする。
import { z } from "zod";

export const dayOfWeekSchema = z.enum([
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
]);

export const courseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  dayOfWeek: dayOfWeekSchema,
  period: z.number().int().min(1).max(8),
  building: z.string().max(50).optional(),
  floor: z.string().max(20).optional(),
  room: z.string().max(50).optional(),
});

// 登録（POST）の入力。id は DB が決める
export const createCourseSchema = courseSchema.omit({ id: true });

// 変更（PATCH）の入力。送った項目だけ変える
export const updateCourseSchema = createCourseSchema.partial();

export const courseResponseSchema = z.object({ course: courseSchema });

export const coursesResponseSchema = z.object({
  courses: z.array(courseSchema),
});

export type DayOfWeek = z.infer<typeof dayOfWeekSchema>;
export type Course = z.infer<typeof courseSchema>;
export type CreateCourse = z.infer<typeof createCourseSchema>;
export type UpdateCourse = z.infer<typeof updateCourseSchema>;
export type CoursesResponse = z.infer<typeof coursesResponseSchema>;
