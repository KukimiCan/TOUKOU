// front 担当のファイル。
// 時間割画面の中身。週の表（timetable-editor.tsx）と、時間割の設定の欄（#58）をまとめる。
// - 開いたときに、科目（GET /api/courses）と設定（GET /api/settings）を API から読み込む（#59）
// - 読み込み中は表の形の骨格を出し、読み込めなかったとき・ログインしていないときは、それぞれの表示を出す
// - 設定は保存（PATCH /api/settings）できたら、表の左の時刻と、科目フォームの時限の選択肢にすぐ反映する
"use client";

import { LogIn, RotateCw, Settings2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { type Course, coursesResponseSchema } from "@/contracts/courses";
import { type Settings, settingsResponseSchema } from "@/contracts/settings";

import { ApiError, errorMessage, fetchApi } from "./fetch-api";
import { SettingsForm } from "./settings-form";
import {
  SavedNotice,
  openSheet,
  Sheet,
  TimetableEditor,
  useSavedNotice,
} from "./timetable-editor";
import { Button } from "./ui/button";

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
    if (load.error instanceof ApiError && load.error.status === 401) {
      return (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <LogIn aria-hidden className="text-muted size-6" />
          <p className="[word-break:auto-phrase]">
            ログインすると、時間割を登録・確認できます。
          </p>
          <Link
            href="/login"
            className="bg-foreground text-background hover:bg-foreground/85 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors"
          >
            <LogIn aria-hidden className="size-4" />
            ログインする
          </Link>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <TriangleAlert aria-hidden className="text-danger size-6" />
        <div role="alert" className="flex flex-col gap-1">
          <p className="font-semibold">時間割を読み込めませんでした</p>
          <p className="text-muted text-sm [word-break:auto-phrase]">
            {errorMessage(load.error)}
          </p>
        </div>
        <Button
          variant="secondary"
          icon={<RotateCw aria-hidden className="size-4" />}
          onClick={retry}
          className="whitespace-nowrap"
        >
          もう一度読み込む
        </Button>
      </div>
    );
  }

  return (
    <TimetableContent
      initialCourses={load.courses}
      initialSettings={load.settings}
    />
  );
}

// 読み込み中の骨格。週の表（5 曜日 × 5 時限）と設定の欄の形を先に見せる
function TimetableSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">時間割を読み込んでいます</span>
      <div className="skeleton h-4 w-64 max-w-full" />
      <div
        aria-hidden
        className="border-line bg-line grid gap-px overflow-hidden rounded-sm border"
        style={{ gridTemplateColumns: "2.75rem repeat(5, minmax(0, 1fr))" }}
      >
        {Array.from({ length: 6 * 6 }, (_, i) => {
          const isHeader = i < 6 || i % 6 === 0;
          return (
            <div
              key={i}
              className={`${isHeader ? "bg-background" : "bg-surface"} ${
                i < 6 ? "h-9" : "h-[4.5rem]"
              } p-1.5`}
            >
              {/* 授業が入っていそうな数マスだけ、骨格を入れる */}
              {!isHeader && [8, 15, 21, 26].includes(i) && (
                <div className="skeleton size-full" />
              )}
            </div>
          );
        })}
      </div>
      <div className="border-line mt-6 flex flex-col gap-3 border-t pt-5">
        <div className="skeleton h-5 w-32" />
        <div className="skeleton h-4 w-48" />
      </div>
    </div>
  );
}

// 読み込めたあとの画面（週の表と設定の欄）
function TimetableContent({
  initialCourses,
  initialSettings,
}: {
  initialCourses: Course[];
  initialSettings: Settings;
}) {
  const [settings, setSettings] = useState(initialSettings);
  // 開くたびにフォームをいまの設定に戻すための番号
  const [opened, setOpened] = useState(0);
  const [notice, showNotice] = useSavedNotice();
  // <dialog> は、HTML の標準の「画面の上に重ねて出す箱」。showModal() で開き、close() で閉じる
  const dialogRef = useRef<HTMLDialogElement>(null);

  function open() {
    setOpened((n) => n + 1);
    openSheet(dialogRef.current);
  }

  // 設定を API に保存する。保存できなかったときは、フォームに出すメッセージを返す
  async function save(next: Settings): Promise<string | null> {
    try {
      const res = await fetchApi("/api/settings", {
        method: "PATCH",
        body: next,
      });
      setSettings(settingsResponseSchema.parse(await res.json()));
      dialogRef.current?.close();
      showNotice("設定を保存しました");
      return null;
    } catch (error) {
      return `保存できませんでした。${errorMessage(error)}`;
    }
  }

  const periods = [...settings.periods].sort((a, b) => a.period - b.period);

  return (
    <>
      <TimetableEditor
        initialCourses={initialCourses}
        periodTimes={settings.periods}
      />

      {/* 設定の欄。カードにせず、見出しと罫線で表と区切る */}
      <section
        aria-labelledby="settings-title"
        className="border-line mt-6 flex flex-col gap-4 border-t pt-5"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="settings-title" className="text-base font-bold">
            時間割の設定
          </h2>
          <Button
            variant="secondary"
            icon={<Settings2 aria-hidden className="size-4" />}
            onClick={open}
            className="whitespace-nowrap"
          >
            設定を変更
          </Button>
        </div>
        <dl className="flex flex-col gap-4 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted">移動の余裕時間</dt>
            <dd>
              <span className="font-display text-lg font-semibold tabular-nums">
                {settings.travelBufferMinutes}
              </span>
              <span className="ml-1">分前に移動</span>
            </dd>
          </div>
          <div className="flex flex-col gap-2">
            <dt className="text-muted">時限の時刻</dt>
            <dd>
              <ul className="font-display grid grid-cols-2 gap-x-6 gap-y-1 tabular-nums sm:grid-cols-4">
                {periods.map(({ period, start, end }) => (
                  <li
                    key={period}
                    className="border-line flex items-baseline gap-2 border-b py-1"
                  >
                    <span className="w-5 font-semibold">
                      {period}
                      <span className="sr-only">限</span>
                    </span>
                    <span className="text-muted whitespace-nowrap">
                      {start}–{end}
                    </span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </section>

      <Sheet
        dialogRef={dialogRef}
        titleId="settings-dialog-title"
        title="時間割の設定"
      >
        <SettingsForm key={opened} initial={settings} onSubmit={save} />
      </Sheet>

      <SavedNotice notice={notice} />
    </>
  );
}
