// front 担当のファイル。
// 科目の入力フォーム（曜日・時限・科目名・建物・階数・教室）。
// 登録（#56）と変更（#57）で使い回す。最初の値と「送ったときの処理」を外から受け取る。
// 入力は contracts の zod スキーマ（createCourseSchema）でチェックし、エラーは日本語で出す。
// 送っている間はボタンに回る印を出し、押せないようにする（API に送るのを待つため。#59）。
// 入力欄・エラーの見た目（inputClass、FieldError、FormError）は、設定のフォーム（settings-form.tsx）でも使う。
"use client";

import { CircleAlert } from "lucide-react";
import { useId, useState } from "react";

import {
  type CreateCourse,
  createCourseSchema,
  dayOfWeekSchema,
} from "@/contracts/courses";
import type { PeriodTime } from "@/contracts/settings";

import { Button } from "./ui/button";
import { DAY_LABELS } from "./timetable-grid";

// 時限は contracts の決まりで 1〜8。設定の時限が読めないときに使う
const ALL_PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

// 選べる時限：設定にある時限（いまの科目の時限が設定に無いときも、選んだままにできるよう足す）
function periodOptions(periodTimes: PeriodTime[], current: number) {
  const set = new Set(periodTimes.map((p) => p.period));
  if (set.size === 0) return ALL_PERIODS;
  set.add(current);
  return [...set].sort((a, b) => a - b);
}

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
  // 送っている間は true（ボタンに回る印を出し、押せないようにする）
  const [pending, setPending] = useState(false);
  const id = useId();

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

  // 項目ごとの id（ラベルと入力欄、エラーの文をつなぐ）
  const fieldProps = (name: FieldName) => ({
    id: `${id}-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${id}-${name}-error` : undefined,
    className: inputClass,
  });

  const field = (name: FieldName, optional = false) => ({
    htmlFor: `${id}-${name}`,
    label: FIELD_LABELS[name],
    optional,
    error: errors[name],
    errorId: `${id}-${name}-error`,
  });

  return (
    // noValidate：ブラウザの英語まじりの吹き出しではなく、下の日本語のメッセージで知らせる
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-[2fr_3fr] gap-3">
        <Field {...field("dayOfWeek")}>
          <select {...fieldProps("dayOfWeek")} defaultValue={initial.dayOfWeek}>
            {dayOfWeekSchema.options.map((day) => (
              <option key={day} value={day}>
                {DAY_LABELS[day]}曜
              </option>
            ))}
          </select>
        </Field>
        <Field {...field("period")}>
          <select {...fieldProps("period")} defaultValue={initial.period}>
            {periodOptions(periodTimes, initial.period).map((period) => (
              <option key={period} value={period}>
                {periodLabel(period)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field {...field("name")}>
        <input
          {...fieldProps("name")}
          defaultValue={initial.name}
          maxLength={50}
          placeholder="例：線形代数"
          autoComplete="off"
        />
      </Field>
      <Field {...field("building", true)}>
        <input
          {...fieldProps("building")}
          defaultValue={initial.building}
          maxLength={50}
          placeholder="例：本館"
          autoComplete="off"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field {...field("floor", true)}>
          <input
            {...fieldProps("floor")}
            defaultValue={initial.floor}
            maxLength={20}
            placeholder="例：3F"
            autoComplete="off"
          />
        </Field>
        <Field {...field("room", true)}>
          <input
            {...fieldProps("room")}
            defaultValue={initial.room}
            maxLength={50}
            placeholder="例：301"
            autoComplete="off"
          />
        </Field>
      </div>

      {formError && <FormError>{formError}</FormError>}

      <Button type="submit" loading={pending} className="w-full py-3">
        {pending ? "保存しています" : submitLabel}
      </Button>
    </form>
  );
}

// 入力欄の見た目（枠・背景・余白は globals.css で設定済み）。科目と設定のフォームでそろえる。
// 文字は 16px（text-base）。iPhone で入力欄を押したときに、画面が勝手に拡大されないようにするため。
// エラーのある欄（aria-invalid）は、枠を失敗の色にする。
// globals.css の input の決まりは Tailwind のクラスより優先されるので、枠の色は「!」を付けて上書きする
export const inputClass =
  "w-full min-w-0 text-base hover:border-muted! aria-invalid:border-danger!";

// 入力欄の下に出す、項目ごとのエラー
export function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p
      id={id}
      role="alert"
      className="text-danger flex items-start gap-1.5 text-sm [word-break:auto-phrase]"
    >
      <CircleAlert aria-hidden className="mt-[0.2em] size-4 shrink-0" />
      {children}
    </p>
  );
}

// フォーム全体のエラー（通信の失敗、重複など）。ボタンの上に、帯で出す
export function FormError({ children }: { children: string }) {
  return (
    <p
      role="alert"
      className="bg-danger/10 text-danger flex items-start gap-2 px-3 py-2.5 text-sm [word-break:auto-phrase]"
    >
      <CircleAlert aria-hidden className="mt-[0.2em] size-4 shrink-0" />
      {children}
    </p>
  );
}

// ラベル + 入力欄 + エラーの 1 項目
function Field({
  htmlFor,
  label,
  optional,
  error,
  errorId,
  children,
}: {
  htmlFor: string;
  label: string;
  optional: boolean;
  error?: string;
  errorId: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-sm font-semibold whitespace-nowrap"
      >
        {label}
        {optional && (
          <span className="text-muted ml-1 text-xs font-normal">任意</span>
        )}
      </label>
      {children}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
