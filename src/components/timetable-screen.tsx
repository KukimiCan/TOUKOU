// front 担当のファイル。
// 時間割画面の中身。週の表（timetable-editor.tsx）と、時間割の設定の欄（#58）をまとめる。
// 設定はここで持ち、保存したら表の左の時刻と、科目フォームの時限の選択肢にすぐ反映する。
// いまは画面の中だけで設定を持つ（再読み込みすると初期値に戻る）。API につなぐのは #59。
"use client";

import { useRef, useState } from "react";

import type { Course } from "@/contracts/courses";
import type { Settings } from "@/contracts/settings";

import { SettingsForm } from "./settings-form";
import { TimetableEditor } from "./timetable-editor";

type Props = {
  initialCourses: Course[];
  initialSettings: Settings;
};

export function TimetableScreen({ initialCourses, initialSettings }: Props) {
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

  function save(next: Settings) {
    setSettings(next);
    close();
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
