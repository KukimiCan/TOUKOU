// front 担当のファイル（時間割画面）。
// 科目と設定は API（/api/courses、/api/settings）から読み込み、登録・変更・削除・設定の保存も API に送る（#59）。
// 読み込みと保存は timetable-screen.tsx（ブラウザで動く部品）が行う。
import type { Metadata } from "next";

import { TimetableScreen } from "@/components/timetable-screen";

export const metadata: Metadata = {
  title: "時間割 | TOUKOU",
};

export default function TimetablePage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-bold">時間割</h1>
      <TimetableScreen />
    </main>
  );
}
