// front 担当のファイル。
// 時間割画面の本体。週の表と、科目を登録・変更するボトムシート（画面の下から出る入力欄）をまとめる。
// - 空いたマス（＋）を押すと、その曜日・時限が入った状態で登録フォームが開く（#56）
// - 科目のマスを押すと、その科目が入った状態で変更フォームが開く。シートの下から削除もできる（#57）
// - 削除は、シートの中で「削除しますか？」と確認してから行う
// - 同じ曜日・時限に別の科目があるときは登録・変更しない（週の表は 1 マスに 1 つしか出せないため）
// - 登録・変更・削除は API（/api/courses）に送り、成功したら表に反映する（#59）
// - 送っている間はボタンに回る印を出し、失敗したらシートの中にメッセージを出す
// - 成功したら、画面の下に「登録しました」などを少しの間だけ出し、そのマスを強調する
// ボトムシート（Sheet）と保存できたことの知らせ（SavedNotice）は、設定の欄（timetable-screen.tsx）でも使う。
"use client";

import { CalendarPlus, Check, Plus, Trash2, X } from "lucide-react";
import {
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";

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
import { DAY_LABELS, DAYS_BY_GET_DAY, TimetableGrid } from "./timetable-grid";
import { Button } from "./ui/button";

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

// 登録・変更したマスを強調しておく時間（ミリ秒）
const HIGHLIGHT_MS = 1600;

export function TimetableEditor({ initialCourses, periodTimes }: Props) {
  const [courses, setCourses] = useState(initialCourses);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  // 削除を送っている間は true / 削除できなかったときのメッセージ
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // 登録・変更した直後に強調する科目
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [notice, showNotice] = useSavedNotice();
  // 今日の曜日（表の見出しを強調する）。この部品はブラウザで読み込みが終わってから出るので、端末の時刻を使える
  const [today] = useState(() => DAYS_BY_GET_DAY[new Date().getDay()]);
  // <dialog> は、HTML の標準の「画面の上に重ねて出す箱」。showModal() で開き、close() で閉じる
  const dialogRef = useRef<HTMLDialogElement>(null);

  // 強調は少し経ったら外す
  useEffect(() => {
    if (!highlightId) return;
    const timer = setTimeout(() => setHighlightId(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightId]);

  function openCreate(dayOfWeek: DayOfWeek, period: number) {
    setSheet((prev) => ({
      mode: "create",
      dayOfWeek,
      period,
      opened: (prev?.opened ?? 0) + 1,
    }));
    openSheet(dialogRef.current);
  }

  function openEdit(course: Course) {
    setDeleteError(null);
    setSheet((prev) => ({
      mode: "edit",
      course,
      confirmingDelete: false,
      opened: (prev?.opened ?? 0) + 1,
    }));
    openSheet(dialogRef.current);
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
      close();
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
      close();
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
    close();
    showNotice(`「${course.name}」を削除しました`);
  }

  const title =
    sheet?.mode === "edit"
      ? sheet.confirmingDelete
        ? "科目を削除"
        : "科目を変更"
      : "科目を登録";

  return (
    <>
      {courses.length === 0 ? (
        // 空のとき：空であることと、最初にやることへの導線（アイコン＋短い文＋ボタン）
        <div className="border-accent bg-accent-soft flex flex-col gap-3 border-l-2 px-4 py-4 sm:flex-row sm:items-center">
          <CalendarPlus
            aria-hidden
            className="text-accent size-6 shrink-0 sm:size-7"
          />
          <div className="flex flex-1 flex-col gap-0.5">
            <p className="font-semibold">まだ科目が登録されていません</p>
            <p className="text-muted text-sm [word-break:auto-phrase]">
              表の＋を押すと、その曜日・時限に科目を登録できます。
            </p>
          </div>
          <Button
            icon={<Plus aria-hidden className="size-4" />}
            onClick={() => openCreate(today === "sun" ? "mon" : today, 1)}
            className="whitespace-nowrap"
          >
            最初の科目を登録
          </Button>
        </div>
      ) : (
        <p className="text-muted text-sm [word-break:auto-phrase]">
          ＋のマスを押すと登録、科目を押すと変更・削除できます。
        </p>
      )}

      <TimetableGrid
        courses={courses}
        periodTimes={periodTimes}
        today={today}
        highlightId={highlightId}
        onSelectEmpty={openCreate}
        onSelectCourse={openEdit}
      />

      <Sheet dialogRef={dialogRef} titleId="course-dialog-title" title={title}>
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
              <div className="border-line mt-5 border-t pt-4">
                <Button
                  variant="ghost"
                  icon={<Trash2 aria-hidden className="size-4" />}
                  onClick={() => setConfirmingDelete(true)}
                  className="text-danger! hover:bg-danger/5 w-full py-3"
                >
                  この科目を削除
                </Button>
              </div>
            </div>

            {sheet.confirmingDelete && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <p className="[word-break:auto-phrase]">
                    「{sheet.course.name}」を削除しますか？
                  </p>
                  <p className="text-muted text-sm [word-break:auto-phrase]">
                    {DAY_LABELS[sheet.course.dayOfWeek]}曜 {sheet.course.period}
                    限から消えます。元に戻せません。
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
                    onClick={() => deleteCourse(sheet.course)}
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
      </Sheet>

      <SavedNotice notice={notice} />
    </>
  );
}

// シートを開く。開いた直後は、閉じるボタンではなくシートそのものに入力の位置（フォーカス）を置く
// （閉じるボタンに枠が出て目立つのと、うっかり閉じるのを防ぐため）
export function openSheet(dialog: HTMLDialogElement | null) {
  dialog?.showModal();
  dialog?.focus();
}

// ボトムシート。スマホでは画面の下に横いっぱいに出し、広い画面では真ん中に出す。
// 開くときは下から少し持ち上がる（150〜250ms。動きを減らす設定のときは止まる）
export function Sheet({
  dialogRef,
  titleId,
  title,
  children,
}: {
  dialogRef: RefObject<HTMLDialogElement | null>;
  titleId: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      tabIndex={-1}
      className="bg-background text-foreground border-line backdrop:bg-foreground/40 mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-xl translate-y-6 overflow-y-auto rounded-t-sm border-t px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] opacity-0 transition-[opacity,translate,display,overlay] transition-discrete duration-200 ease-out outline-none open:translate-y-0 open:opacity-100 sm:mb-auto sm:rounded-sm sm:border sm:pb-5 starting:open:translate-y-6 starting:open:opacity-0"
    >
      <div className="border-line mb-5 flex items-center justify-between border-b pb-3">
        <h2 id={titleId} className="text-lg font-bold">
          {title}
        </h2>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="閉じる"
          className="text-muted hover:text-foreground -mr-2 flex size-11 items-center justify-center"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>
      {children}
    </dialog>
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
