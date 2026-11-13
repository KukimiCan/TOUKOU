// back 担当のファイル。
// 時間割の科目の保存先（仮）。DB の courses テーブル（issue #3）ができるまで、メモリに保存する。
// サーバーを再起動すると消える。ユーザーごとに分けて、他人の科目が混ざらないようにする。
import type { Course, CreateCourse, UpdateCourse } from "@/contracts/courses";

const coursesByUser = new Map<string, Course[]>();

export function listCourses(userId: string): Course[] {
  return coursesByUser.get(userId) ?? [];
}

export function addCourse(userId: string, input: CreateCourse): Course {
  const course: Course = { ...input, id: crypto.randomUUID() };
  coursesByUser.set(userId, [...listCourses(userId), course]);
  return course;
}

// 見つからない（他人の科目も含む）ときは null
export function updateCourse(
  userId: string,
  id: string,
  patch: UpdateCourse,
): Course | null {
  const current = listCourses(userId);
  const target = current.find((course) => course.id === id);
  if (!target) return null;

  const updated: Course = { ...target, ...patch };
  coursesByUser.set(
    userId,
    current.map((course) => (course.id === id ? updated : course)),
  );
  return updated;
}

// 削除できたら true。見つからない（他人の科目も含む）ときは false
export function deleteCourse(userId: string, id: string): boolean {
  const current = listCourses(userId);
  const remaining = current.filter((course) => course.id !== id);
  if (remaining.length === current.length) return false;

  coursesByUser.set(userId, remaining);
  return true;
}
