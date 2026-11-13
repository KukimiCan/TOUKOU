// 仮データ（架空の科目）。形は src/contracts/courses.ts に合わせる。
import type { Course, CoursesResponse } from "@/contracts/courses";

export const mockCourses: Course[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "微分積分学（仮）",
    dayOfWeek: "mon",
    period: 1,
    building: "本館",
    floor: "3F",
    room: "301",
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "プログラミング基礎（仮）",
    dayOfWeek: "wed",
    period: 3,
    building: "研究棟",
    floor: "2F",
    room: "204",
  },
];

export const mockCoursesResponse: CoursesResponse = { courses: mockCourses };
