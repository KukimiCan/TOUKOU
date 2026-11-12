// front 担当のファイル。
// 時間割の設定の入力フォーム（移動の余裕時間と、1〜8 限の開始・終了時刻）（#58）。
// 時限の数は 1〜8 限で固定にする（科目のフォームがいつも 1〜8 限を選べるのとそろえるため）。
// 入力は contracts の zod スキーマ（settingsSchema）でチェックし、エラーは日本語で出す。
"use client";

import { useState } from "react";

import { type Settings, settingsSchema } from "@/contracts/settings";

type Errors = {
  travelBufferMinutes?: string;
  // 時限ごとのエラー（例：終了時刻が開始時刻より前）
  periods: Record<number, string>;
  // 時限の並び全体のエラー（いまの画面では起きないが、念のため出せるようにしておく）
  form?: string;
};

const NO_ERRORS: Errors = { periods: {} };

type Props = {
  // 最初に入れておく値（いまの設定）
  initial: Settings;
  // 入力が正しいときに呼ぶ
  onSubmit: (settings: Settings) => void;
};

export function SettingsForm({ initial, onSubmit }: Props) {
  const [errors, setErrors] = useState<Errors>(NO_ERRORS);
  const periods = [...initial.periods].sort((a, b) => a.period - b.period);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const text = (key: string) => String(formData.get(key) ?? "").trim();
    // 空欄は 0 ではなく「数字ではない」として扱い、エラーにする
    const buffer = text("travelBufferMinutes");

    const parsed = settingsSchema.safeParse({
      travelBufferMinutes: buffer === "" ? Number.NaN : Number(buffer),
      periods: periods.map(({ period }) => ({
        period,
        start: text(`start-${period}`),
        end: text(`end-${period}`),
      })),
    });

    if (!parsed.success) {
      const next: Errors = { periods: {} };
      for (const issue of parsed.error.issues) {
        const [field, index] = issue.path;
        if (field === "travelBufferMinutes") {
          next.travelBufferMinutes = "0〜60 の整数で入力してください";
        } else if (typeof index === "number") {
          const period = periods[index].period;
          // 空欄のときは、contracts の「HH:MM 形式で…」より分かりやすい言い方にする
          next.periods[period] ??=
            issue.code === "invalid_format"
              ? "開始と終了の時刻を入力してください"
              : issue.message;
        } else {
          next.form ??= issue.message;
        }
      }
      setErrors(next);
      return;
    }

    setErrors(NO_ERRORS);
    onSubmit(parsed.data);
  }

  return (
    // noValidate：ブラウザの英語まじりの吹き出しではなく、下の日本語のメッセージで知らせる
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">移動の余裕時間</span>
        <span className="text-sm opacity-70">
          授業が始まる何分前に移動を始めるか（0〜60 分）
        </span>
        <span className="flex items-center gap-2">
          <input
            name="travelBufferMinutes"
            type="number"
            inputMode="numeric"
            min={0}
            max={60}
            defaultValue={initial.travelBufferMinutes}
            className={`${inputClass} w-24`}
          />
          分
        </span>
        {errors.travelBufferMinutes && (
          <span role="alert" className={errorClass}>
            {errors.travelBufferMinutes}
          </span>
        )}
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">時限の時刻</legend>
        {periods.map(({ period, start, end }) => (
          <div key={period} className="flex flex-col gap-1">
            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <span className="text-sm font-semibold">{period}限</span>
              <input
                name={`start-${period}`}
                type="time"
                defaultValue={start}
                aria-label={`${period}限の開始時刻`}
                className={`${inputClass} w-full`}
              />
              <span aria-hidden>〜</span>
              <input
                name={`end-${period}`}
                type="time"
                defaultValue={end}
                aria-label={`${period}限の終了時刻`}
                className={`${inputClass} w-full`}
              />
            </div>
            {errors.periods[period] && (
              <span role="alert" className={`${errorClass} pl-12`}>
                {errors.periods[period]}
              </span>
            )}
          </div>
        ))}
      </fieldset>

      {errors.form && (
        <p role="alert" className={errorClass}>
          {errors.form}
        </p>
      )}

      <button
        type="submit"
        className="bg-foreground text-background rounded px-4 py-3 font-semibold"
      >
        保存する
      </button>
    </form>
  );
}

// 入力欄の見た目は科目のフォーム（course-form.tsx）とそろえる。
// 文字は 16px（text-base）。iPhone で入力欄を押したときに、画面が勝手に拡大されないようにするため
const inputClass =
  "min-w-0 rounded border border-current/30 bg-transparent px-2 py-2 text-base";

const errorClass = "text-sm text-red-600 dark:text-red-400";
