// front 担当のファイル。
// 時間割画面の中身。週の表（timetable-editor.tsx）と、時間割の設定の欄（#58）をまとめる。
// - 開いたときに、科目（GET /api/courses）と設定（GET /api/settings）を API から読み込む（#59）
// - 読み込み中・読み込めなかったとき・ログインしていないときは、それぞれの表示を出す
// - 設定は保存（PATCH /api/settings）できたら、表の左の時刻と、科目フォームの時限の選択肢にすぐ反映する
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { type Course, coursesResponseSchema } from "@/contracts/courses";
import { type Settings, settingsResponseSchema } from "@/contracts/settings";

import { ApiError, errorMessage, fetchApi } from "./fetch-api";
import { SettingsForm } from "./settings-form";
import { TimetableEditor } from "./timetable-editor";

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

  if (load.status === "loading") {
    return (
      <p role="status" className="py-12 text-center text-sm opacity-70">
        時間割を読み込んでいます…
      </p>
    );
  }

  if (load.status === "error") {
    // ログインしていないときは、読み込み直しても同じなので、ログインへの案内を出す
    if (load.error instanceof ApiError && load.error.status === 401) {
      return (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p>ログインすると、時間割を登録・確認できます。</p>
          <Link
            href="/login"
            className="bg-foreground text-background rounded px-6 py-3 font-semibold"
          >
            ログインする
          </Link>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div role="alert" className="flex flex-col gap-1">
          <p className="font-semibold">時間割を読み込めませんでした</p>
          <p className="text-sm opacity-70">{errorMessage(load.error)}</p>
        </div>
        <button
          type="button"
          onClick={retry}
          className="rounded border border-current/30 px-6 py-3 font-semibold"
        >
          もう一度読み込む
        </button>
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
  // <dialog> は、HTML の標準の「画面の上に重ねて出す箱」。showModal() で開き、close() で閉じる
  const dialogRef = useRef<HTMLDialogElement>(null);

  function open() {
    setOpened((n) => n + 1);
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  // 設定を API に保存する。保存できなかったときは、フォームに出すメッセージを返す
  async function save(next: Settings): Promise<string | null> {
    try {
      const res = await fetchApi("/api/settings", {
        method: "PATCH",
        body: next,
      });
      setSettings(settingsResponseSchema.parse(await res.json()));
      close();
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

      <section
        aria-labelledby="settings-title"
        className="mt-4 flex flex-col gap-3 rounded-lg border border-current/20 p-4"
      >
        <h2 id="settings-title" className="font-bold">
          時間割の設定
        </h2>
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex gap-3">
            <dt className="opacity-70">移動の余裕時間</dt>
            <dd className="font-semibold">{settings.travelBufferMinutes} 分</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="opacity-70">時限の時刻</dt>
            <dd>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1 tabular-nums">
                {periods.map(({ period, start, end }) => (
                  <li key={period}>
                    <span className="inline-block w-7 font-semibold">
                      {period}限
                    </span>
                    {start}〜{end}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
        <button
          type="button"
          onClick={open}
          className="rounded border border-current/30 px-4 py-3 font-semibold"
        >
          設定を変更
        </button>
      </section>

      {/* 科目の登録と同じボトムシート。スマホでは画面の下に横いっぱいに出し、広い画面では真ん中に出す */}
      <dialog
        ref={dialogRef}
        aria-labelledby="settings-dialog-title"
        className="bg-background text-foreground mx-auto mt-auto mb-0 max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl p-5 backdrop:bg-black/40 sm:mb-auto sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="settings-dialog-title" className="text-lg font-bold">
            時間割の設定
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
        <SettingsForm key={opened} initial={settings} onSubmit={save} />
      </dialog>
    </>
  );
}
