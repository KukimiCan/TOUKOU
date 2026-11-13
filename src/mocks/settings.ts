// 仮データ（初期設定の例）。形は src/contracts/settings.ts に合わせる。
// 1 限 9:00 から 90 分授業、100 分おき（初期値は docs/spec.md 6 章の仮決め）。
import type { Settings } from "@/contracts/settings";

export const mockSettings: Settings = {
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
