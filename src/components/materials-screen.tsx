// front 担当のファイル。
// 資料の画面（#69）。端末の高さに収め、縦にスクロールさせない（docs/design.md）。
// - 最初の画面は科目の一覧（course-list.tsx）。押すと /materials?course=<id> の、その科目の資料だけの一覧へ
// - 見出しの右に「撮る」ボタン（board-upload.tsx）。科目の中では、その科目を選んだ状態で開く
// - 資料の一覧は materials-list.tsx。長い一覧は、一覧の中だけでスクロールする
// - 開いたときに、資料（GET /api/materials）、科目（GET /api/courses）、時限の時刻（GET /api/settings）を読み込む。
//   時限の時刻は、撮った板書の科目を「今の授業」「直前の授業」から選んでおくために使う（読めなくても送れる）
// - 読み込み中は、画面の形に近い骨格（MaterialsSkeleton）を出す。loading.tsx でも同じものを使う
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { type Course, coursesResponseSchema } from "@/contracts/courses";
import { type Material, materialsResponseSchema } from "@/contracts/materials";
import { type Settings, settingsResponseSchema } from "@/contracts/settings";

import { Screen, ScrollArea } from "./ui/screen";
import { BoardUpload } from "./board-upload";
import { fetchApi } from "./fetch-api";
import { LoadError } from "./load-error";
import { MaterialsList } from "./materials-list";
import { Mascot } from "./mascot";
import {
  BackToCourses,
  buildCourseEntries,
  CourseList,
  UNKNOWN_COURSE,
  UNKNOWN_COURSE_NAME,
} from "./course-list";

type Load =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | {
      status: "ready";
      materials: Material[];
      courses: Course[];
      settings: Settings | null;
    };

// 時限の時刻は、科目を選んでおくための補助。読めなくても画面は出す
async function loadSettings() {
  try {
    const res = await fetchApi("/api/settings");
    return settingsResponseSchema.parse(await res.json());
  } catch {
    return null;
  }
}

async function loadMaterials() {
  const [materialsRes, coursesRes, settings] = await Promise.all([
    fetchApi("/api/materials"),
    fetchApi("/api/courses"),
    loadSettings(),
  ]);
  const { materials } = materialsResponseSchema.parse(
    await materialsRes.json(),
  );
  const { courses } = coursesResponseSchema.parse(await coursesRes.json());
  return { materials, courses, settings };
}

const LABEL = "Materials";
const TITLE = "資料";

export function MaterialsScreen() {
  const courseParam = useSearchParams().get("course");
  const [load, setLoad] = useState<Load>({ status: "loading" });
  // 「もう一度読み込む」を押した回数。変わるたびに読み込み直す
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // 読み込みの途中で画面を離れたら、結果を使わない
    let ignore = false;
    loadMaterials()
      .then((data) => {
        if (!ignore) setLoad({ status: "ready", ...data });
      })
      .catch((error: unknown) => {
        if (!ignore) setLoad({ status: "error", error });
      });
    return () => {
      ignore = true;
    };
  }, [attempt]);

  function retry() {
    setLoad({ status: "loading" });
    setAttempt((n) => n + 1);
  }

  if (load.status === "loading") return <MaterialsSkeleton />;

  if (load.status === "error") {
    return (
      <Screen label={LABEL} title={TITLE} width="max-w-3xl">
        <LoadError
          error={load.error}
          title="資料を読み込めませんでした"
          loginMessage="ログインすると、板書を追加したり、資料を確認したりできます。"
          onRetry={retry}
        />
      </Screen>
    );
  }

  const { materials, courses, settings } = load;
  const canUpload = courses.length > 0;
  const known = new Set(courses.map((c) => c.id));
  const groupOf = (m: Material) =>
    known.has(m.courseId) ? m.courseId : UNKNOWN_COURSE;

  // 科目の中
  const selected =
    courseParam === UNKNOWN_COURSE
      ? { id: UNKNOWN_COURSE, name: UNKNOWN_COURSE_NAME }
      : courses.find((c) => c.id === courseParam);
  if (selected) {
    const mine = materials.filter((m) => groupOf(m) === selected.id);
    const course = selected.id === UNKNOWN_COURSE ? undefined : selected.id;
    return (
      <Screen
        label={<BackToCourses href="/materials" />}
        labelStyle="ja"
        title={selected.name}
        width="max-w-3xl"
        actions={
          course &&
          mine.length > 0 && (
            <BoardUpload
              courses={courses}
              settings={settings}
              defaultCourseId={course}
              place="header"
            />
          )
        }
      >
        <MaterialsList
          materials={mine}
          courses={courses}
          emptyAction={
            course ? (
              <BoardUpload
                courses={courses}
                settings={settings}
                defaultCourseId={course}
                place="empty"
              />
            ) : null
          }
        />
      </Screen>
    );
  }

  // 科目の一覧
  const counts = new Map<string, number>();
  for (const m of materials) {
    counts.set(groupOf(m), (counts.get(groupOf(m)) ?? 0) + 1);
  }
  const entries = buildCourseEntries(
    courses,
    new Date(),
    (id) => counts.get(id) ?? 0,
    (n) => (n > 0 ? `資料 ${n}` : "資料なし"),
    { hideEmpty: false },
  );

  return (
    <Screen
      label={LABEL}
      title={TITLE}
      width="max-w-3xl"
      // 今の授業の板書をすぐ撮れるよう、見出しの右に置く（科目は今の授業から選んでおく）
      actions={
        canUpload && (
          <BoardUpload courses={courses} settings={settings} place="header" />
        )
      }
    >
      {canUpload ? (
        <ScrollArea className="border-line -mx-4 border-t px-4 sm:-mx-6 sm:px-6">
          <CourseList
            entries={entries}
            basePath="/materials"
            ariaLabel="科目"
          />
        </ScrollArea>
      ) : (
        <MaterialsList materials={[]} courses={courses} emptyAction={null} />
      )}
    </Screen>
  );
}

// 読み込み中の骨格。見出し（本物と同じ）、行
export function MaterialsSkeleton() {
  return (
    <Screen
      label={LABEL}
      title={TITLE}
      width="max-w-3xl"
      actions={<div className="skeleton h-11 w-24" />}
    >
      <div role="status" aria-live="polite" className="flex flex-col gap-3">
        <span className="sr-only">資料を読み込んでいます</span>
        <div aria-hidden className="flex shrink-0 justify-center">
          <Mascot expression="smug" bob size={72} decorative />
        </div>
        <div className="divide-line border-line flex flex-col divide-y border-y">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3.5">
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-3 w-24" />
              </div>
              <div className="skeleton h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
}
