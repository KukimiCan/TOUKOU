// back 担当のファイル。
// 時間割の設定（移動の余裕時間、時限の時刻）の保存先。DB の profiles テーブルに保存する。
// 行がまだ無いときは、docs/spec.md の初期値を返す（profiles は新規ユーザーの作成時に自動で作られる）。
import {
  settingsSchema,
  type PeriodTime,
  type Settings,
  type UpdateSettings,
} from "@/contracts/settings";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

// 初期値（docs/spec.md 6 章）：1 限 9:00 から 90 分授業、休み 10 分、移動の余裕 10 分
const defaultSettings: Settings = {
  travelBufferMinutes: 10,
  periods: [
    { period: 1, start: "09:00", end: "10:30" },
    { period: 2, start: "10:40", end: "12:10" },
    { period: 3, start: "12:20", end: "13:50" },
    { period: 4, start: "14:00", end: "15:30" },
    { period: 5, start: "15:40", end: "17:10" },
    { period: 6, start: "17:20", end: "18:50" },
    { period: 7, start: "19:00", end: "20:30" },
    { period: 8, start: "20:40", end: "22:10" },
  ],
};

export async function getSettings(userId: string): Promise<Settings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("travel_buffer_minutes, periods")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return defaultSettings;

  // DB の形を契約で確かめてから返す（壊れた値を画面へ出さない）
  return settingsSchema.parse({
    travelBufferMinutes: data.travel_buffer_minutes,
    periods: data.periods as unknown as PeriodTime[],
  });
}

export async function updateSettings(
  userId: string,
  patch: UpdateSettings,
): Promise<Settings> {
  const updated: Settings = { ...(await getSettings(userId)), ...patch };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: userId,
      travel_buffer_minutes: updated.travelBufferMinutes,
      periods: updated.periods as unknown as Json,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
  return updated;
}
