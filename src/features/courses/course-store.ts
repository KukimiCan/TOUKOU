// back 担当のファイル。
// 時間割の科目の保存先。DB の courses テーブル（RLS で本人の行だけ読み書きできる）に保存する。
// 列名（snake_case）と契約の名前（camelCase）の変換はこのファイルで行う。
import type {
  Course,
  CreateCourse,
  DayOfWeek,
  UpdateCourse,
} from "@/contracts/courses";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type CourseRow = Database["public"]["Tables"]["courses"]["Row"];

// 空欄（null）は、契約では「項目なし」なので省く
function toCourse(row: CourseRow): Course {
  return {
    id: row.id,
    name: row.name,
    dayOfWeek: row.day_of_week as DayOfWeek,
    period: row.period,
    ...(row.building !== null && { building: row.building }),
    ...(row.floor !== null && { floor: row.floor }),
    ...(row.room !== null && { room: row.room }),
  };
}

export async function listCourses(userId: string): Promise<Course[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("user_id", userId)
    .order("day_of_week")
    .order("period");
  if (error) throw error;
  return data.map(toCourse);
}

export async function addCourse(
  userId: string,
  input: CreateCourse,
): Promise<Course> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .insert({
      user_id: userId,
      name: input.name,
      day_of_week: input.dayOfWeek,
      period: input.period,
      building: input.building ?? null,
      floor: input.floor ?? null,
      room: input.room ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return toCourse(data);
}

// 見つからない（他人の科目も含む）ときは null。RLS で他人の行は見えない
export async function updateCourse(
  userId: string,
  id: string,
  patch: UpdateCourse,
): Promise<Course | null> {
  const update: Database["public"]["Tables"]["courses"]["Update"] = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.dayOfWeek !== undefined) update.day_of_week = patch.dayOfWeek;
  if (patch.period !== undefined) update.period = patch.period;
  if (patch.building !== undefined) update.building = patch.building;
  if (patch.floor !== undefined) update.floor = patch.floor;
  if (patch.room !== undefined) update.room = patch.room;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .update(update)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data ? toCourse(data) : null;
}

// 削除できたら true。見つからない（他人の科目も含む）ときは false
export async function deleteCourse(
  userId: string,
  id: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");
  if (error) throw error;
  return data.length > 0;
}
