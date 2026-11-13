// front 担当のファイル。
// 科目の入力フォーム（曜日・時限・科目名・建物・階数・教室）。
// 登録（#56）と変更（#57）で使い回す。最初の値と「送ったときの処理」を外から受け取る。
// 入力は contracts の zod スキーマ（createCourseSchema）でチェックし、エラーは日本語で出す。
// 送っている間はボタンを押せないようにする（API に送るのを待つため。#59）。
"use client";

import { useState } from "react";

import {
  type CreateCourse,
  createCourseSchema,
  dayOfWeekSchema,
} from "@/contracts/courses";
import type { PeriodTime } from "@/contracts/settings";

import { DAY_LABELS } from "./timetable-grid";

// 時限は contracts の決まりで 1〜8
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

type FieldName = keyof CreateCourse;
type FieldErrors = Partial<Record<FieldName, string>>;

const FIELD_LABELS: Record<FieldName, string> = {
  dayOfWeek: "曜日",
  period: "時限",
  name: "科目名",
  building: "建物",
  floor: "階数",
  room: "教室",
};

// フォームの値 → API に送る形。前後の空白を消し、空の任意項目は送らない
function toInput(formData: FormData) {
  const text = (key: FieldName) => String(formData.get(key) ?? "").trim();
  const optional = (key: FieldName) => text(key) || undefined;
  return {
    dayOfWeek: text("dayOfWeek"),
    period: Number(text("period")),
    name: text("name"),
    building: optional("building"),
    floor: optional("floor"),
    room: optional("room"),
  };
}

type Props = {
  // 最初に入れておく値（空きマスから開いたときは曜日と時限だけ、変更のときは科目のすべて）
  initial: Pick<CreateCourse, "dayOfWeek" | "period"> & Partial<CreateCourse>;
  periodTimes: PeriodTime[];
  submitLabel: string;
  // 送ったときの処理（API に送る）。登録できなかったときは、画面に出すメッセージを返す（重複、通信の失敗など）
  onSubmit: (input: CreateCourse) => Promise<string | null>;
};

export function CourseForm({
  initial,
  periodTimes,
  submitLabel,
  onSubmit,
}: Props) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  // 送っている間は true（ボタンを押せないようにする）
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const parsed = createCourseSchema.safeParse(
      toInput(new FormData(event.currentTarget)),
    );

    if (!parsed.success) {
      // 項目ごとに、最初のエラーだけを日本語で出す
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as FieldName;
        if (next[field]) continue;
        const label = FIELD_LABELS[field];
        next[field] =
          issue.code === "too_small"
            ? `${label}を入力してください`
            : issue.code === "too_big"
              ? `${label}は ${String(issue.maximum)} 文字以内にしてください`
              : `${label}を選び直してください`;
      }
      setErrors(next);
      setFormError(null);
      return;
    }

    setErrors({});
    setFormError(null);
    setPending(true);
    setFormError(await onSubmit(parsed.data));
    setPending(false);
  }

  const periodLabel = (period: number) => {
    const time = periodTimes.find((p) => p.period === period);
    return time ? `${period}限（${time.start}〜${time.end}）` : `${period}限`;
  };

  return (
    // noValidate：ブラウザの英語まじりの吹き出しではなく、下の日本語のメッセージで知らせる
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-[2fr_3fr] gap-3">
        <Field name="dayOfWeek" error={errors.dayOfWeek}>
          <select
            name="dayOfWeek"
            defaultValue={initial.dayOfWeek}
            className={inputClass}
          >
            {dayOfWeekSchema.options.map((day) => (
              <option key={day} value={day}>
                {DAY_LABELS[day]}曜
              </option>
            ))}
          </select>
        </Field>
        <Field name="period" error={errors.period}>
          <select
            name="period"
            defaultValue={initial.period}
            className={inputClass}
          >
            {PERIODS.map((period) => (
              <option key={period} value={period}>
                {periodLabel(period)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field name="name" error={errors.name}>
        <input
          name="name"
          defaultValue={initial.name}
          maxLength={50}
          autoComplete="off"
          className={inputClass}
        />
      </Field>
      <Field name="building" optional error={errors.building}>
        <input
          name="building"
          defaultValue={initial.building}
          maxLength={50}
          placeholder="例：本館"
          autoComplete="off"
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field name="floor" optional error={errors.floor}>
          <input
            name="floor"
            defaultValue={initial.floor}
            maxLength={20}
            placeholder="例：3F"
            autoComplete="off"
            className={inputClass}
          />
        </Field>
        <Field name="room" optional error={errors.room}>
          <input
            name="room"
            defaultValue={initial.room}
            maxLength={50}
            placeholder="例：301"
            autoComplete="off"
            className={inputClass}
          />
        </Field>
      </div>

      {formError && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {formError}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-foreground text-background rounded px-4 py-3 font-semibold disabled:opacity-50"
      >
        {pending ? "保存しています…" : submitLabel}
      </button>
    </form>
  );
}

// 入力欄の見た目はログインフォーム（#74）とそろえる。
// 文字は 16px（text-base）。iPhone で入力欄を押したときに、画面が勝手に拡大されないようにするため
const inputClass =
  "w-full rounded border border-current/30 bg-transparent px-3 py-3 text-base";

// ラベル + 入力欄 + エラーの 1 項目
function Field({
  name,
  optional = false,
  error,
  children,
}: {
  name: FieldName;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-sm font-semibold">
        {FIELD_LABELS[name]}
        {optional && <span className="font-normal opacity-70">（任意）</span>}
      </span>
      {children}
      {error && (
        <span role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </span>
      )}
    </label>
  );
}
