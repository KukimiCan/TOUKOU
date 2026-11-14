// front 担当のファイル。
// 時間割画面の中身。週の表（timetable-editor.tsx）と、時間割の設定（#58）をまとめる。
// - 開いたときに、科目（GET /api/courses）と設定（GET /api/settings）を API から読み込む（#59）
// - 読み込み中は表の形の骨格を出し、読み込めなかったとき・ログインしていないときは、それぞれの表示を出す
// - 設定は主役ではないので画面に並べず、見出しの右の歯車からモーダルで開く
// - 設定は保存（PATCH /api/settings）できたら、表の左の時刻と、科目フォームの時限の選択肢にすぐ反映する
"use client";

import { LogIn, RotateCw, Settings2, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { type Course, coursesResponseSchema } from "@/contracts/courses";
import { type Settings, settingsResponseSchema } from "@/contracts/settings";

import { ApiError, errorMessage, fetchApi } from "./fetch-api";
import { SettingsForm } from "./settings-form";
import {
  SavedNotice,
  TimetableEditor,
  useSavedNotice,
} from "./timetable-editor";
import { Button } from "./ui/button";
import { ButtonLink } from "./ui/button-link";
import { Modal } from "./ui/modal";
import { Screen } from "./ui/screen";

// 画面を開いたときの読み込みの状態
type Load =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; courses: Course[]; settings: Settings };

// 科目と設定を同時に読み込む
async function loadTimetable() {
  const [coursesRes, settingsRes] = await Promise.all([
    fetchApi("/api/courses"),
    fetchApi("/api/settings"),
  ]);
  const { courses } = coursesResponseSchema.parse(await coursesRes.json());
  const settings = settingsResponseSchema.parse(await settingsRes.json());
  return { courses, settings };
}

export function TimetableScreen() {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  // 「もう一度読み込む」を押した回数。変わるたびに読み込み直す
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // 読み込みの途中で画面を離れたら、結果を使わない
    let ignore = false;
    loadTimetable()
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

  if (load.status === "loading") return <TimetableSkeleton />;

  if (load.status === "error") {
    // ログインしていないときは、読み込み直しても同じなので、ログインへの案内を出す
    const loggedOut =
      load.error instanceof ApiError && load.error.status === 401;
    return (
      <Screen title="時間割" width="max-w-3xl">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 pb-12 text-center">
          {loggedOut ? (
            <>
              <LogIn aria-hidden className="text-muted size-6" />
              <p className="[word-break:auto-phrase]">
                ログインすると、時間割を登録・確認できます。
              </p>
              <ButtonLink
                href="/login"
                icon={<LogIn aria-hidden className="size-4" />}
                className="px-6"
              >
                ログインする
              </ButtonLink>
            </>
          ) : (
            <>
              <TriangleAlert aria-hidden className="text-danger size-6" />
              <div role="alert" className="flex flex-col gap-1">
                <p className="font-bold">時間割を読み込めませんでした</p>
                <p className="text-muted text-sm [word-break:auto-phrase]">
                  {errorMessage(load.error)}
                </p>
              </div>
              <Button
                variant="secondary"
                icon={<RotateCw aria-hidden className="size-4" />}
                onClick={retry}
              >
                もう一度読み込む
              </Button>
            </>
          )}
        </div>
      </Screen>
    );
  }

  return (
    <TimetableContent
      initialCourses={load.courses}
      initialSettings={load.settings}
    />
  );
}

// 読み込み中の骨格。読み込み後と同じ枠で、週の表（5 曜日 × 5 時限）の形を先に見せる
function TimetableSkeleton() {
  return (
    <Screen title="時間割" width="max-w-3xl">
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col"
      >
        <span className="sr-only">時間割を読み込んでいます</span>
        <div
          aria-hidden
          className="border-line bg-line grid min-h-0 flex-1 gap-px overflow-hidden rounded-sm border sm:max-h-[40rem]"
          style={{
            gridTemplateColumns: "2.75rem repeat(5, minmax(0, 1fr))",
            gridTemplateRows: "2rem repeat(5, minmax(2.75rem, 1fr))",
          }}
        >
          {Array.from({ length: 6 * 6 }, (_, i) => {
            const isHeader = i < 6 || i % 6 === 0;
            return (
              <div
                key={i}
                className={`${isHeader ? "bg-background" : "bg-surface"} p-0.5`}
              >
                {/* 授業が入っていそうな数マスだけ、骨格を入れる */}
                {!isHeader && [8, 15, 21, 26].includes(i) && (
                  <div className="skeleton size-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Screen>
  );
}

// 読み込めたあとの画面（週の表と、設定のモーダル）
function TimetableContent({
  initialCourses,
  initialSettings,
}: {
  initialCourses: Course[];
  initialSettings: Settings;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [open, setOpen] = useState(false);
  // 開くたびにフォームをいまの設定に戻すための番号
  const [opened, setOpened] = useState(0);
  const [notice, showNotice] = useSavedNotice();

  function openSettings() {
    setOpened((n) => n + 1);
    setOpen(true);
  }

  // 設定を API に保存する。保存できなかったときは、フォームに出すメッセージを返す
  async function save(next: Settings): Promise<string | null> {
    try {
      const res = await fetchApi("/api/settings", {
        method: "PATCH",
        body: next,
      });
      setSettings(settingsResponseSchema.parse(await res.json()));
      setOpen(false);
      showNotice("設定を保存しました");
      return null;
    } catch (error) {
      return `保存できませんでした。${errorMessage(error)}`;
    }
  }

  return (
    <TimetableEditor
      initialCourses={initialCourses}
      periodTimes={settings.periods}
      actions={
        <Button
          variant="ghost"
          aria-label="時間割の設定"
          title="時間割の設定"
          onClick={openSettings}
          className="size-11 px-0! py-0!"
        >
          <Settings2 aria-hidden className="size-5" />
        </Button>
      }
    >
      <Modal open={open} onClose={() => setOpen(false)} title="時間割の設定">
        <SettingsForm key={opened} initial={settings} onSubmit={save} />
      </Modal>
      <SavedNotice notice={notice} />
    </TimetableEditor>
  );
}
