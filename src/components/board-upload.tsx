// front 担当のファイル。
// 板書の撮影・アップロード（#66）。操作を最小にする：「撮る」→（撮影）→「送る」の 3 回で終わる。
// 1. 「撮る」でカメラを開く（capture を付けた入力欄はカメラしか開かないので、「写真から選ぶ」を別に置く）
// 2. 撮ったらすぐモーダルを開き、縮小した画像と科目を出す。科目は時間割から
//    「今の授業」か「直前の授業」を選んでおく（違えば押して選び直す）
// 3. 「送る」で API（POST /api/materials）に送り、モーダルを閉じて元の画面に残る。解説は裏で作り、終わったら通知で知らせる（generation-provider.tsx）
// 失敗したときは、理由（形式・大きさ・通信）を見出しで分けて出す。
"use client";

import { appNow } from "@/lib/app-clock";
import { Camera, CircleAlert, ImagePlus, RotateCcw, Send } from "lucide-react";
import { useEffect, useState } from "react";

import type { Course, DayOfWeek } from "@/contracts/courses";
import {
  type MaterialResponse,
  materialResponseSchema,
  uploadMaterialFieldsSchema,
} from "@/contracts/materials";
import type { Settings } from "@/contracts/settings";

import { Button, buttonClass } from "./ui/button";
import { Modal } from "./ui/modal";
import { Spinner } from "./ui/spinner";
import { ApiError, errorMessage, fetchApi } from "./fetch-api";
import { useGeneration } from "./generation-provider";
import { ImageError, resizeImage } from "./resize-image";

type Props = {
  // 科目を選ぶための、時間割の科目（1 つ以上）
  courses: Course[];
  // 時限の時刻。科目を選んでおくのに使う（読めなかったときは null）
  settings: Settings | null;
  // 科目の中の画面から開くときの、選んでおく科目（無ければ、今の授業などから選ぶ）
  defaultCourseId?: string;
  // header：見出しの右に小さく。empty：資料が無いときに、画面の真ん中に大きく
  place: "header" | "empty";
};

// 画像と項目（file / courseId / kind）を FormData で送り、追加された資料を受け取る
async function upload(body: FormData): Promise<MaterialResponse> {
  const res = await fetchApi("/api/materials", { method: "POST", body });
  return materialResponseSchema.parse(await res.json());
}

// 選んだ画像（縮小したもの）と、プレビュー用の URL
type Picked = { file: File; previewUrl: string };

// 画面に出す失敗。title で何が起きたか、detail で次にどうすればよいかを伝える
type Failure = { title: string; detail: string };

function imageFailure(e: unknown): Failure {
  if (e instanceof ImageError) {
    const title = {
      format: "この形式の画像は読み込めません",
      size: "画像が大きすぎます",
      other: "画像を準備できませんでした",
    }[e.kind];
    return { title, detail: e.message };
  }
  return {
    title: "画像を準備できませんでした",
    detail: "もう一度、撮り直してください。",
  };
}

function uploadFailure(e: unknown): Failure {
  // 413 = 送ったデータが大きすぎる（サーバーの上限）
  if (e instanceof ApiError && e.status === 413) {
    return {
      title: "画像が大きすぎます",
      detail: "撮り直すか、別の写真を選んでください。",
    };
  }
  return { title: "送れませんでした", detail: errorMessage(e) };
}

// ---- 科目を選んでおく ----

// Date.getDay() の順（日曜が 0）
const DAYS: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export type Suggestion = { courseId: string; reason: "now" | "last" | null };

// 今の授業（授業中）があればそれ。無ければ、終わった授業のうち一番最近のもの（1 週間さかのぼる）
export function suggestCourse(
  courses: Course[],
  settings: Settings | null,
  now: Date,
): Suggestion | null {
  if (courses.length === 1) {
    return { courseId: courses[0].id, reason: null };
  }
  if (!settings) return null;

  const times = new Map(
    settings.periods.map((p) => [
      p.period,
      { start: toMinutes(p.start), end: toMinutes(p.end) },
    ]),
  );
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const today = now.getDay();

  let last: { courseId: string; endsAgo: number } | null = null;
  for (const course of courses) {
    const time = times.get(course.period);
    if (!time) continue;
    // 何日前の曜日か（0 = 今日）
    const daysAgo = (today - DAYS.indexOf(course.dayOfWeek) + 7) % 7;
    if (daysAgo === 0 && time.start <= nowMinutes && nowMinutes <= time.end) {
      return { courseId: course.id, reason: "now" };
    }
    // 終わってからの分。今日のまだ終わっていない授業は、1 週間前の回として数える
    let endsAgo = daysAgo * 24 * 60 + nowMinutes - time.end;
    if (endsAgo < 0) endsAgo += 7 * 24 * 60;
    if (!last || endsAgo < last.endsAgo) {
      last = { courseId: course.id, endsAgo };
    }
  }
  return last && { courseId: last.courseId, reason: "last" };
}

// 選んでおいた科目を先頭に、あとは曜日・時限の順に並べる
function orderCourses(courses: Course[], firstId: string | undefined) {
  const order = (c: Course) =>
    c.id === firstId
      ? -1
      : ((DAYS.indexOf(c.dayOfWeek) + 6) % 7) * 10 + c.period;
  return [...courses].sort((a, b) => order(a) - order(b));
}

const REASON_LABELS = { now: "今の授業", last: "直前の授業" } as const;

// ---- 部品 ----

// 写真を選ぶ入力欄（label）を、ボタンの見た目にする。
// 入力欄は見えなくしているので、キーボードで選んだときは label に枠を出す
const focusRing =
  "min-h-11 cursor-pointer has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent";

function PickInput({
  camera,
  onPick,
  disabled = false,
}: {
  camera: boolean;
  onPick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="file"
      accept="image/*"
      capture={camera ? "environment" : undefined}
      onChange={onPick}
      disabled={disabled}
      className="sr-only"
    />
  );
}

export function BoardUpload({
  courses,
  settings,
  defaultCourseId,
  place,
}: Props) {
  const { startGeneration, notifyChanged } = useGeneration();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Picked | null>(null);
  // 画像を縮小している間は true
  const [preparing, setPreparing] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [courseId, setCourseId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);

  // プレビュー用の URL は、使い終わったら片付ける（ブラウザのメモリを空けるため）
  useEffect(() => {
    if (!picked) return;
    return () => URL.revokeObjectURL(picked.previewUrl);
  }, [picked]);

  async function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // 同じ写真をもう一度選んでも反応するよう、入力欄を空にしておく
    event.target.value = "";
    if (!file) return;

    // 撮った時刻で科目を選び直す（撮り直しのときは、選んだ科目を残す）
    if (!open) {
      const next = defaultCourseId
        ? { courseId: defaultCourseId, reason: null }
        : suggestCourse(courses, settings, appNow());
      setSuggestion(next);
      setCourseId(next?.courseId ?? "");
    }
    setOpen(true);
    setFailure(null);
    setPicked(null);
    setPreparing(true);
    try {
      const resized = await resizeImage(file);
      setPicked({ file: resized, previewUrl: URL.createObjectURL(resized) });
    } catch (e) {
      setFailure(imageFailure(e));
    } finally {
      setPreparing(false);
    }
  }

  function close() {
    if (uploading) return;
    setOpen(false);
    setPicked(null);
    setFailure(null);
  }

  async function handleSend() {
    if (!picked || uploading) return;
    const fields = uploadMaterialFieldsSchema.safeParse({
      courseId,
      kind: "board",
    });
    if (!fields.success) {
      setFailure({
        title: "科目を選んでください",
        detail: "どの授業の板書かを選ぶと、科目ごとに整理されます。",
      });
      return;
    }

    const body = new FormData();
    body.append("file", picked.file);
    body.append("courseId", fields.data.courseId);
    body.append("kind", fields.data.kind);

    setFailure(null);
    setUploading(true);
    try {
      const { material } = await upload(body);
      // 送れたら、モーダルを閉じて元の画面に残る。一覧は取り直し、解説は裏で作る（終わったら通知）
      const courseName =
        courses.find((c) => c.id === fields.data.courseId)?.name ?? "授業";
      notifyChanged();
      startGeneration(material.id, courseName);
      setUploading(false);
      setOpen(false);
      setPicked(null);
    } catch (e) {
      setFailure(uploadFailure(e));
      setUploading(false);
    }
  }

  const ordered = orderCourses(courses, suggestion?.courseId);

  return (
    <>
      {place === "header" ? (
        <div className="flex items-center gap-1">
          <label
            aria-label="写真から選ぶ"
            title="写真から選ぶ"
            className={buttonClass("ghost", `${focusRing} px-3`)}
          >
            <ImagePlus aria-hidden className="size-5" />
            <PickInput camera={false} onPick={handlePick} />
          </label>
          <label className={buttonClass("primary", focusRing)}>
            <Camera aria-hidden className="size-4" />
            {/* 広い画面（PC）ではカメラが開かず、ファイルを選ぶ画面になる */}
            <span className="sm:hidden">撮る</span>
            <span className="hidden sm:inline">板書を追加</span>
            <PickInput camera onPick={handlePick} />
          </label>
        </div>
      ) : (
        <div className="flex w-full max-w-xs flex-col gap-2">
          <label className={buttonClass("primary", `${focusRing} w-full`)}>
            <Camera aria-hidden className="size-4" />
            板書を撮る
            <PickInput camera onPick={handlePick} />
          </label>
          <label className={buttonClass("secondary", `${focusRing} w-full`)}>
            <ImagePlus aria-hidden className="size-4" />
            写真から選ぶ
            <PickInput camera={false} onPick={handlePick} />
          </label>
        </div>
      )}

      <Modal
        open={open}
        onClose={close}
        title="板書を送る"
        footer={
          <>
            <label
              className={buttonClass(
                "ghost",
                `${focusRing} mr-auto -ml-3 ${uploading ? "pointer-events-none opacity-50" : ""}`,
              )}
            >
              <RotateCcw aria-hidden className="size-4" />
              撮り直す
              <PickInput camera onPick={handlePick} disabled={uploading} />
            </label>
            <Button
              type="button"
              onClick={handleSend}
              loading={uploading}
              disabled={!picked || !courseId}
              icon={<Send aria-hidden className="size-4" />}
              className="min-w-32"
            >
              {uploading ? "送っています" : "送る"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="border-line bg-background relative grid h-[32dvh] place-items-center overflow-hidden rounded-sm border">
            {picked ? (
              // eslint-disable-next-line @next/next/no-img-element -- 選んだ画像はまだ送っていないので、ブラウザの中の URL を直接出す
              <img
                src={picked.previewUrl}
                alt="送る板書"
                className={`size-full object-contain transition-opacity ${uploading ? "opacity-60" : ""}`}
              />
            ) : preparing ? (
              <p
                role="status"
                className="text-muted flex items-center gap-2 text-sm"
              >
                <Spinner />
                画像を準備しています
              </p>
            ) : null}
            {/* 送っている間は、画像の上端に進行中の線を出す */}
            {uploading && (
              <span
                aria-hidden
                className="bg-accent absolute inset-x-0 top-0 h-0.5 origin-left"
                style={{ animation: "bar 900ms ease-out infinite alternate" }}
              />
            )}
          </div>

          <fieldset className="flex flex-col gap-2" disabled={uploading}>
            <legend className="text-muted mb-2 text-sm">科目</legend>
            <div className="flex flex-wrap gap-2">
              {ordered.map((course) => {
                const selected = course.id === courseId;
                const reason =
                  course.id === suggestion?.courseId && suggestion.reason
                    ? REASON_LABELS[suggestion.reason]
                    : null;
                return (
                  <label
                    key={course.id}
                    className={`has-focus-visible:outline-accent inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-sm border px-3.5 text-sm whitespace-nowrap transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 ${
                      selected
                        ? "border-foreground bg-foreground text-background font-semibold"
                        : "border-line bg-surface hover:border-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="board-course"
                      value={course.id}
                      checked={selected}
                      onChange={() => {
                        setCourseId(course.id);
                        setFailure(null);
                      }}
                      className="sr-only"
                    />
                    {course.name}
                    {reason && (
                      <span
                        className={`text-xs font-normal ${selected ? "text-accent-soft" : "text-accent"}`}
                      >
                        {reason}
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>

          {failure && (
            <div
              role="alert"
              className="bg-danger/10 text-danger flex gap-2 rounded-sm px-3 py-2.5 text-sm"
            >
              <CircleAlert aria-hidden className="mt-1 size-4 shrink-0" />
              <div className="flex flex-col">
                <p className="font-semibold">{failure.title}</p>
                <p className="[word-break:auto-phrase]">{failure.detail}</p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
