// front 担当のファイル（時間割画面）。
// いまは仮データ（src/mocks/）で週の表を表示し、空いたマスから科目を登録できる（登録した科目は画面の中だけ）。
// API につなぐのは #59。
import type { Metadata } from "next";

import { TimetableEditor } from "@/components/timetable-editor";
import { mockSettings } from "@/mocks/settings";
// 7 列（土日あり）の表示を確かめるときは mockWeekendCourses に変える
import { mockWeekdayCourses } from "@/mocks/timetable-preview";

export const metadata: Metadata = {
  title: "時間割 | TOUKOU",
};

export default function TimetablePage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-bold">時間割</h1>
      <TimetableEditor
        initialCourses={mockWeekdayCourses}
        periodTimes={mockSettings.periods}
      />
    </main>
  );
}
