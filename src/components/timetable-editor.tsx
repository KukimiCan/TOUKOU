// front 担当のファイル。
// 時間割画面の本体。週の表と、科目を登録するボトムシート（画面の下から出る入力欄）をまとめる。
// - 空いたマスを押すと、その曜日・時限が入った状態で登録フォームが開く（#56）
// - 同じ曜日・時限に科目があるときは登録しない（週の表は 1 マスに 1 つしか出せないため）
// - いまは画面の中だけで科目を持つ（再読み込みすると消える）。API につなぐのは #59
"use client";

import { useRef, useState } from "react";

import type { Course, CreateCourse, DayOfWeek } from "@/contracts/courses";
import type { PeriodTime } from "@/contracts/settings";

import { CourseForm } from "./course-form";
import { DAY_LABELS, TimetableGrid } from "./timetable-grid";

type Props = {
  initialCourses: Course[];
  periodTimes: PeriodTime[];
};

// 開いているフォームの最初の値。opened は、開くたびにフォームを空に戻すための番号
type Draft = { dayOfWeek: DayOfWeek; period: number; opened: number };

export function TimetableEditor({ initialCourses, periodTimes }: Props) {
  const [courses, setCourses] = useState(initialCourses);
  const [draft, setDraft] = useState<Draft | null>(null);
  // <dialog> は、HTML の標準の「画面の上に重ねて出す箱」。showModal() で開き、close() で閉じる
  const dialogRef = useRef<HTMLDialogElement>(null);

  function open(dayOfWeek: DayOfWeek, period: number) {
    setDraft((prev) => ({
      dayOfWeek,
      period,
      opened: (prev?.opened ?? 0) + 1,
    }));
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function addCourse(input: CreateCourse): string | null {
    const taken = courses.find(
      (c) => c.dayOfWeek === input.dayOfWeek && c.period === input.period,
    );
    if (taken) {
      return `${DAY_LABELS[input.dayOfWeek]}${input.period} には「${taken.name}」があります。別の曜日・時限を選んでください。`;
    }

    setCourses((prev) => [...prev, { ...input, id: crypto.randomUUID() }]);
    close();
    return null;
  }

  return (
    <>
      <p className="text-sm opacity-70">
        空いたマスを押すと、科目を登録できます。
      </p>
      <TimetableGrid
        courses={courses}
        periodTimes={periodTimes}
        onSelectEmpty={open}
      />

      {/* スマホでは画面の下に横いっぱいに出し、広い画面では真ん中に出す */}
      <dialog
        ref={dialogRef}
        aria-labelledby="course-dialog-title"
        className="bg-background text-foreground mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl p-5 backdrop:bg-black/40 sm:mb-auto sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="course-dialog-title" className="text-lg font-bold">
            科目を登録
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="閉じる"
            className="-mr-2 rounded p-2 text-xl leading-none opacity-70"
          >
            ✕
          </button>
        </div>
        {draft && (
          <CourseForm
            key={draft.opened}
            initial={{ dayOfWeek: draft.dayOfWeek, period: draft.period }}
            periodTimes={periodTimes}
            submitLabel="登録する"
            onSubmit={addCourse}
          />
        )}
      </dialog>
    </>
  );
}
