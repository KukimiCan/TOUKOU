// back 担当のファイル。
// 時間割の科目の保存先（仮）。DB の courses テーブル（issue #3）ができるまで、メモリに保存する。
// サーバーを再起動すると消える。ユーザーごとに分けて、他人の科目が混ざらないようにする。
import type { Course, CreateCourse } from "@/contracts/courses";

const coursesByUser = new Map<string, Course[]>();

export function listCourses(userId: string): Course[] {
  return coursesByUser.get(userId) ?? [];
}

export function addCourse(userId: string, input: CreateCourse): Course {
  const course: Course = { ...input, id: crypto.randomUUID() };
  coursesByUser.set(userId, [...listCourses(userId), course]);
  return course;
}
