// 仮データ（架空の科目）。時間割の週の表（/timetable）の見た目を確かめるためのもの。
// 形は src/contracts/courses.ts に合わせる。長い科目名・教室が未入力の科目・6 限の授業を含める。
import type { Course } from "@/contracts/courses";

// 平日だけに授業がある週（5 列で表示される）
export const mockWeekdayCourses: Course[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    name: "微分積分学（仮）",
    dayOfWeek: "mon",
    period: 1,
    building: "本館",
    floor: "3F",
    room: "301",
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    name: "英語",
    dayOfWeek: "mon",
    period: 2,
    building: "本館",
    floor: "2F",
    room: "204",
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
    name: "情報科学のための確率・統計とデータ解析入門（仮）",
    dayOfWeek: "tue",
    period: 2,
    building: "研究棟",
    floor: "4F",
    room: "412",
  },
  {
    id: "00000000-0000-4000-8000-000000000104",
    name: "プログラミング基礎（仮）",
    dayOfWeek: "wed",
    period: 3,
    building: "研究棟",
    floor: "2F",
    room: "204",
  },
  {
    id: "00000000-0000-4000-8000-000000000105",
    name: "体育",
    dayOfWeek: "thu",
    period: 4,
  },
  {
    id: "00000000-0000-4000-8000-000000000106",
    name: "Academic English II",
    dayOfWeek: "fri",
    period: 1,
    building: "国際棟",
    floor: "1F",
    room: "A-101",
  },
  {
    id: "00000000-0000-4000-8000-000000000107",
    name: "ゼミ",
    dayOfWeek: "fri",
    period: 6,
    building: "研究棟",
    floor: "5F",
    room: "研究室",
  },
];

// 土曜にも授業がある週（7 列で表示され、授業の無い日曜の列は細くなる）
export const mockWeekendCourses: Course[] = [
  ...mockWeekdayCourses,
  {
    id: "00000000-0000-4000-8000-000000000108",
    name: "公開講座（仮）",
    dayOfWeek: "sat",
    period: 2,
    building: "本館",
    floor: "1F",
    room: "大講義室",
  },
];
