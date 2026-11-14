// front 担当のファイル。
// 時間割画面の本体。画面の枠（Screen）、週の表、科目を登録・変更するモーダルをまとめる。
// 画面は端末の高さに収め、縦にスクロールさせない（表の行の高さは、残りの高さで割って決める）。
// - 空いたマス（＋）を押すと、その曜日・時限が入った状態で登録フォームが開く（#56）
// - 見出しの右の「追加」でも登録できる（表に出ていない土日・時限に登録するとき）
// - 科目のマスを押すと、その科目が入った状態で変更フォームが開く。モーダルの下から削除もできる（#57）
// - 削除は、モーダルの中で「削除しますか？」と確認してから行う
// - 同じ曜日・時限に別の科目があるときは登録・変更しない（週の表は 1 マスに 1 つしか出せないため）
// - 登録・変更・削除は API（/api/courses）に送り、成功したら表に反映する（#59）
// - 送っている間はボタンに回る印を出し、失敗したらモーダルの中にメッセージを出す
// - 成功したら、画面の下に「登録しました」などを少しの間だけ出し、そのマスを強調する
// 保存できたことの知らせ（SavedNotice）は、設定の保存（timetable-screen.tsx）でも使う。
"use client";

import {
  CalendarPlus,
  Check,
  ChevronsDownUp,
  ChevronsUpDown,
  Plus,
  Trash2,
} from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import {
  type Course,
  type CreateCourse,
  courseResponseSchema,
  type DayOfWeek,
  type UpdateCourse,
} from "@/contracts/courses";
import type { PeriodTime } from "@/contracts/settings";

import { CourseForm, FormError } from "./course-form";
import { ApiError, errorMessage, fetchApi } from "./fetch-api";
import {
  DAY_LABELS,
  DAYS_BY_GET_DAY,
  getVisiblePeriods,
  TimetableGrid,
} from "./timetable-grid";
import { Button } from "./ui/button";
import { Modal } from "./ui/modal";
import { Screen } from "./ui/screen";

type Props = {
  initialCourses: Course[];
  periodTimes: PeriodTime[];
  // 見出しの右に、追加のボタンと並べて置く操作（設定を開くボタン）
  actions?: ReactNode;
  // 画面に重ねて出すもの（設定のモーダルなど）
  children?: ReactNode;
};

// モーダルで開いている内容
// - create：登録
// - edit：変更（confirmingDelete が true のときは、削除の確認を出す）
// opened は、開くたびにフォームを最初の値に戻すための番号
type Dialog =
  | { mode: "create"; dayOfWeek: DayOfWeek; period: number; opened: number }
  | {
      mode: "edit";
      course: Course;
      confirmingDelete: boolean;
      opened: number;
    };

// 登録・変更したマスを強調しておく時間（ミリ秒）
const HIGHLIGHT_MS = 1600;

export function TimetableEditor({
  initialCourses,
  periodTimes,
  actions,
  children,
}: Props) {
  const [courses, setCourses] = useState(initialCourses);
  // 閉じる動きの間も中身を残すため、中身（dialog）と開いているか（open）を分けて持つ
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [open, setOpen] = useState(false);
  // 削除を送っている間は true / 削除できなかったときのメッセージ
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // 登録・変更した直後に強調する科目
  const [highlightId, setHighlightId] = useState<string | null>(null);
  // 全部の時限を出しているか（ふだんは授業のある時限とその前後だけ）
  const [showAll, setShowAll] = useState(false);
  const [notice, showNotice] = useSavedNotice();
  // 今日の曜日（表の列を塗る）。この部品はブラウザで読み込みが終わってから出るので、端末の時刻を使える
  const [today] = useState(() => DAYS_BY_GET_DAY[new Date().getDay()]);

  // 強調は少し経ったら外す
  useEffect(() => {
    if (!highlightId) return;
    const timer = setTimeout(() => setHighlightId(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightId]);

  const allPeriods = [...periodTimes]
    .map((p) => p.period)
    .sort((a, b) => a - b);
  const periods = getVisiblePeriods(courses, allPeriods, showAll);
  const canToggle =
    getVisiblePeriods(courses, allPeriods, false).length < allPeriods.length;

  function openCreate(dayOfWeek: DayOfWeek, period: number) {
    setDialog((prev) => ({
      mode: "create",
      dayOfWeek,
      period,
      opened: (prev?.opened ?? 0) + 1,
    }));
    setOpen(true);
  }

  function openEdit(course: Course) {
    setDeleteError(null);
    setDialog((prev) => ({
      mode: "edit",
      course,
      confirmingDelete: false,
      opened: (prev?.opened ?? 0) + 1,
    }));
    setOpen(true);
  }

  // 「追加」から開いたときは、今日（日曜は月曜）の、表で最初に空いている時限を入れておく
  function openCreateFromHeader() {
    const day = today === "sun" ? "mon" : today;
    const free =
      allPeriods.find(
        (p) => !courses.some((c) => c.dayOfWeek === day && c.period === p),
      ) ?? 1;
    openCreate(day, free);
  }

  // 削除の確認を出す / やめて変更の画面に戻る
  function setConfirmingDelete(confirmingDelete: boolean) {
    setDeleteError(null);
    setDialog((prev) =>
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
    return `${DAY_LABELS[input.dayOfWeek]}曜 ${input.period}限には「${taken.name}」があります。別の曜日・時限を選んでください。`;
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
      setOpen(false);
      setHighlightId(course.id);
      showNotice(`「${course.name}」を登録しました`);
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
      setOpen(false);
      setHighlightId(course.id);
      showNotice("変更を保存しました");
      return null;
    } catch (error) {
      return `保存できませんでした。${errorMessage(error)}`;
    }
  }

  async function deleteCourse(course: Course) {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await fetchApi(`/api/courses/${course.id}`, { method: "DELETE" });
    } catch (error) {
      // 404 は「もう無い」ということなので、削除できたのと同じに扱う
      if (!(error instanceof ApiError && error.status === 404)) {
        setDeleteError(`削除できませんでした。${errorMessage(error)}`);
        setDeleting(false);
        return;
      }
    }
    setCourses((prev) => prev.filter((c) => c.id !== course.id));
    setDeleting(false);
    setOpen(false);
    showNotice(`「${course.name}」を削除しました`);
  }

  const title =
    dialog?.mode === "edit"
      ? dialog.confirmingDelete
        ? "科目を削除"
        : "科目を変更"
      : "科目を登録";

  return (
    <Screen
      title="時間割"
      width="max-w-3xl"
      actions={
        <>
          <Button
            variant="secondary"
            icon={<Plus aria-hidden className="size-4" />}
            onClick={openCreateFromHeader}
            className="px-3"
          >
            追加
          </Button>
          {actions}
        </>
      }
    >
      {courses.length === 0 && (
        // 空のとき：空であることと、最初にやること（アイコン＋短い文。ボタンは見出しの「追加」とマスの＋）
        <p className="text-muted flex shrink-0 items-start gap-2 text-sm [word-break:auto-phrase]">
          <CalendarPlus
            aria-hidden
            className="text-accent mt-[0.2em] size-4 shrink-0"
          />
          <span>
            まだ科目がありません。
            <wbr />
            空いたマスか「追加」から登録します。
          </span>
        </p>
      )}

      <TimetableGrid
        courses={courses}
        periodTimes={periodTimes}
        periods={periods}
        today={today}
        highlightId={highlightId}
        onSelectEmpty={openCreate}
        onSelectCourse={openEdit}
      />

      {/* 隠している時限があるときだけ、全部の時限との切り替えを出す */}
      {canToggle && (
        <div className="-mt-2 flex shrink-0 justify-end">
          <Button
            variant="ghost"
            icon={
              showAll ? (
                <ChevronsDownUp aria-hidden className="size-4" />
              ) : (
                <ChevronsUpDown aria-hidden className="size-4" />
              )
            }
            aria-pressed={showAll}
            onClick={() => setShowAll((v) => !v)}
            className="px-2 py-1.5"
          >
            {showAll
              ? "授業のある時限だけ表示"
              : `すべての時限を表示（${allPeriods.length} 限まで）`}
          </Button>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={title}>
        {dialog?.mode === "create" && (
          <CourseForm
            key={dialog.opened}
            initial={{ dayOfWeek: dialog.dayOfWeek, period: dialog.period }}
            periodTimes={periodTimes}
            submitLabel="登録する"
            onSubmit={addCourse}
          />
        )}

        {/* 変更のフォームは、削除の確認を出している間も消さずに隠す（「やめる」で入力途中の内容に戻れるように） */}
        {dialog?.mode === "edit" && (
          <>
            <div hidden={dialog.confirmingDelete}>
              <CourseForm
                key={dialog.opened}
                initial={dialog.course}
                periodTimes={periodTimes}
                submitLabel="変更を保存"
                onSubmit={(input) => updateCourse(dialog.course.id, input)}
              />
              <Button
                variant="ghost"
                icon={<Trash2 aria-hidden className="size-4" />}
                onClick={() => setConfirmingDelete(true)}
                className="text-danger! hover:bg-danger/5 mt-2 w-full py-3"
              >
                この科目を削除
              </Button>
            </div>

            {dialog.confirmingDelete && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <p className="[word-break:auto-phrase]">
                    「{dialog.course.name}」を削除しますか？
                  </p>
                  <p className="text-muted text-sm [word-break:auto-phrase]">
                    {DAY_LABELS[dialog.course.dayOfWeek]}曜{" "}
                    {dialog.course.period}限から消えます。
                    <wbr />
                    元に戻せません。
                  </p>
                </div>
                {deleteError && <FormError>{deleteError}</FormError>}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setConfirmingDelete(false)}
                    disabled={deleting}
                    className="py-3"
                  >
                    やめる
                  </Button>
                  <Button
                    variant="danger"
                    icon={<Trash2 aria-hidden className="size-4" />}
                    onClick={() => deleteCourse(dialog.course)}
                    loading={deleting}
                    className="py-3"
                  >
                    {deleting ? "削除しています" : "削除する"}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Modal>

      {children}

      <SavedNotice notice={notice} />
    </Screen>
  );
}

// 保存できたことの知らせを、少しの間だけ出すためのフック。
// 同じ文が続いても出し直せるよう、出すたびに番号を変える
const NOTICE_MS = 2600;

// 消すときは文を残したまま薄くする（消える途中で枠が縮まないように）
export type Notice = { text: string; n: number; visible: boolean } | null;

export function useSavedNotice() {
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    if (!notice?.visible) return;
    const timer = setTimeout(
      () => setNotice((prev) => (prev ? { ...prev, visible: false } : prev)),
      NOTICE_MS,
    );
    return () => clearTimeout(timer);
  }, [notice]);

  function show(text: string) {
    setNotice((prev) => ({ text, n: (prev?.n ?? 0) + 1, visible: true }));
  }

  return [notice, show] as const;
}

// 保存できたことの知らせ。スマホでは下のナビの上、広い画面では右下に出す。
// 読み上げにも伝わるよう、枠（role="status"）はいつも置いておき、中の文だけを入れ替える
export function SavedNotice({ notice }: { notice: Notice }) {
  const visible = notice?.visible ?? false;
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-[calc(3.5rem+1rem+env(safe-area-inset-bottom))] z-30 flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      {notice && (
        <p
          aria-hidden={!visible}
          className={`bg-foreground text-background flex items-center gap-2 px-4 py-2.5 text-sm font-semibold [word-break:auto-phrase] transition-[opacity,translate] duration-200 ease-out ${
            visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          <span className="bg-success flex size-5 shrink-0 items-center justify-center rounded-full">
            <Check
              aria-hidden
              className="text-surface size-3.5"
              strokeWidth={3}
            />
          </span>
          {notice.text}
        </p>
      )}
    </div>
  );
}
