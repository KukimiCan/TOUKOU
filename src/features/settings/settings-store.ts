// back 担当のファイル。
// 時間割の設定の保存先（仮）。DB の profiles テーブル（issue #3）ができるまで、メモリに保存する。
// サーバーを再起動すると消える。ユーザーごとに分けて、他人の設定が混ざらないようにする。
import type { Settings, UpdateSettings } from "@/contracts/settings";

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

const settingsByUser = new Map<string, Settings>();

export function getSettings(userId: string): Settings {
  return settingsByUser.get(userId) ?? defaultSettings;
}

export function updateSettings(
  userId: string,
  patch: UpdateSettings,
): Settings {
  const updated: Settings = { ...getSettings(userId), ...patch };
  settingsByUser.set(userId, updated);
  return updated;
}
