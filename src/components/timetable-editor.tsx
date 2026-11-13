// front 担当のファイル。
// 時間割画面の本体。週の表と、科目を登録・変更するボトムシート（画面の下から出る入力欄）をまとめる。
// - 空いたマスを押すと、その曜日・時限が入った状態で登録フォームが開く（#56）
// - 科目のマスを押すと、その科目が入った状態で変更フォームが開く。シートの下から削除もできる（#57）
// - 削除は、シートの中で「削除しますか？」と確認してから行う
// - 同じ曜日・時限に別の科目があるときは登録・変更しない（週の表は 1 マスに 1 つしか出せないため）
// - 登録・変更・削除は API（/api/courses）に送り、成功したら表に反映する（#59）
// - 送っている間はボタンを押せないようにし、失敗したらシートの中にメッセージを出す
"use client";

import { useRef, useState } from "react";

import {
  type Course,
  type CreateCourse,
  courseResponseSchema,
  type DayOfWeek,
  type UpdateCourse,
} from "@/contracts/courses";
import type { PeriodTime } from "@/contracts/settings";

import { CourseForm } from "./course-form";
import { ApiError, errorMessage, fetchApi } from "./fetch-api";
import { DAY_LABELS, TimetableGrid } from "./timetable-grid";

type Props = {
  initialCourses: Course[];
  periodTimes: PeriodTime[];
};

// シートで開いている内容
// - create：空いたマスから開いた登録
// - edit：科目のマスから開いた変更（confirmingDelete が true のときは、削除の確認を出す）
// opened は、開くたびにフォームを最初の値に戻すための番号
type Sheet =
  | { mode: "create"; dayOfWeek: DayOfWeek; period: number; opened: number }
  | {
      mode: "edit";
      course: Course;
      confirmingDelete: boolean;
      opened: number;
    };

export function TimetableEditor({ initialCourses, periodTimes }: Props) {
  const [courses, setCourses] = useState(initialCourses);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  // 削除を送っている間は true / 削除できなかったときのメッセージ
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // <dialog> は、HTML の標準の「画面の上に重ねて出す箱」。showModal() で開き、close() で閉じる
  const dialogRef = useRef<HTMLDialogElement>(null);

  function openCreate(dayOfWeek: DayOfWeek, period: number) {
    setSheet((prev) => ({
      mode: "create",
      dayOfWeek,
      period,
      opened: (prev?.opened ?? 0) + 1,
    }));
    dialogRef.current?.showModal();
  }

  function openEdit(course: Course) {
    setDeleteError(null);
    setSheet((prev) => ({
      mode: "edit",
      course,
      confirmingDelete: false,
      opened: (prev?.opened ?? 0) + 1,
    }));
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  // 削除の確認を出す / やめて変更の画面に戻る
  function setConfirmingDelete(confirmingDelete: boolean) {
    setDeleteError(null);
    setSheet((prev) =>
      prev?.mode === "edit" ? { ...prev, confirmingDelete } : prev,
    );
  }

  // 同じ曜日・時限にある、ほかの科目（変更のときは、変えている科目そのものは数えない）
  function findTaken(input: CreateCourse, exceptId?: string) {
    return courses.find(
      (c) =>
        c.id !== exceptId &&
        c.dayOfWeek === input.dayOfWeek &&
        c.period === input.period,
    );
  }

  function takenMessage(input: CreateCourse, taken: Course) {
    return `${DAY_LABELS[input.dayOfWeek]}${input.period} には「${taken.name}」があります。別の曜日・時限を選んでください。`;
  }

  async function addCourse(input: CreateCourse): Promise<string | null> {
    const taken = findTaken(input);
    if (taken) return takenMessage(input, taken);

    try {
      const res = await fetchApi("/api/courses", {
        method: "POST",
        body: input,
      });
      // id は API（DB）が決めるので、返ってきた科目を表に足す
      const { course } = courseResponseSchema.parse(await res.json());
      setCourses((prev) => [...prev, course]);
      close();
      return null;
    } catch (error) {
      return `登録できませんでした。${errorMessage(error)}`;
    }
  }

  async function updateCourse(
    id: string,
    input: CreateCourse,
  ): Promise<string | null> {
    const taken = findTaken(input, id);
    if (taken) return takenMessage(input, taken);

    // PATCH は「送った項目だけ変える」決まり。任意の項目を空にしたときも消えるよう、空なら "" を送る
    const patch: UpdateCourse = {
      ...input,
      building: input.building ?? "",
      floor: input.floor ?? "",
      room: input.room ?? "",
    };

    try {
      const res = await fetchApi(`/api/courses/${id}`, {
        method: "PATCH",
        body: patch,
      });
      const { course } = courseResponseSchema.parse(await res.json());
      setCourses((prev) => prev.map((c) => (c.id === id ? course : c)));
      close();
      return null;
    } catch (error) {
      return `保存できませんでした。${errorMessage(error)}`;
    }
  }

  async function deleteCourse(id: string) {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await fetchApi(`/api/courses/${id}`, { method: "DELETE" });
    } catch (error) {
      // 404 は「もう無い」ということなので、削除できたのと同じに扱う
      if (!(error instanceof ApiError && error.status === 404)) {
        setDeleteError(`削除できませんでした。${errorMessage(error)}`);
        setDeleting(false);
        return;
      }
    }
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setDeleting(false);
    close();
  }

  const title =
    sheet?.mode === "edit"
      ? sheet.confirmingDelete
        ? "科目を削除"
        : "科目を変更"
      : "科目を登録";

  return (
    <>
      <p className="text-sm opacity-70">
        空いたマスを押すと登録、科目を押すと変更・削除できます。
      </p>
      <TimetableGrid
        courses={courses}
        periodTimes={periodTimes}
        onSelectEmpty={openCreate}
        onSelectCourse={openEdit}
      />

      {/* スマホでは画面の下に横いっぱいに出し、広い画面では真ん中に出す */}
      <dialog
        ref={dialogRef}
        aria-labelledby="course-dialog-title"
        className="bg-background text-foreground mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl p-5 backdrop:bg-black/40 sm:mb-auto sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="course-dialog-title" className="text-lg font-bold">
            {title}
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

        {sheet?.mode === "create" && (
          <CourseForm
            key={sheet.opened}
            initial={{ dayOfWeek: sheet.dayOfWeek, period: sheet.period }}
            periodTimes={periodTimes}
            submitLabel="登録する"
            onSubmit={addCourse}
          />
        )}

        {/* 変更のフォームは、削除の確認を出している間も消さずに隠す（「やめる」で入力途中の内容に戻れるように） */}
        {sheet?.mode === "edit" && (
          <>
            <div hidden={sheet.confirmingDelete}>
              <CourseForm
                key={sheet.opened}
                initial={sheet.course}
                periodTimes={periodTimes}
                submitLabel="変更を保存"
                onSubmit={(input) => updateCourse(sheet.course.id, input)}
              />
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="mt-3 w-full rounded px-4 py-3 font-semibold text-red-600 dark:text-red-400"
              >
                この科目を削除
              </button>
            </div>

            {sheet.confirmingDelete && (
              <div className="flex flex-col gap-3">
                <p className="text-base">
                  「{sheet.course.name}」を削除しますか？
                </p>
                <p className="text-sm opacity-70">
                  時間割から消えます。元に戻せません。
                </p>
                {deleteError && (
                  <p
                    role="alert"
                    className="text-sm text-red-600 dark:text-red-400"
                  >
                    {deleteError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => deleteCourse(sheet.course.id)}
                  disabled={deleting}
                  className="mt-2 rounded bg-red-600 px-4 py-3 font-semibold text-white disabled:opacity-50 dark:bg-red-500"
                >
                  {deleting ? "削除しています…" : "削除する"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                  className="rounded border border-current/30 px-4 py-3 font-semibold disabled:opacity-50"
                >
                  やめる
                </button>
              </div>
            )}
          </>
        )}
      </dialog>
    </>
  );
}
