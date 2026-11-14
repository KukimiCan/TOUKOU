// front 担当のファイル。
// 時間割の設定の入力フォーム（移動の余裕時間と、1〜8 限の開始・終了時刻）（#58）。
// 時限の数は 1〜8 限で固定にする（科目のフォームがいつも 1〜8 限を選べるのとそろえるため）。
// 入力は contracts の zod スキーマ（settingsSchema）でチェックし、エラーは日本語で出す。
// 保存している間はボタンに回る印を出し、保存できなかったときはメッセージを出す（#59）。
// 入力欄・エラーの見た目は、科目のフォーム（course-form.tsx）とそろえる。
"use client";

import { useId, useState } from "react";

import { type Settings, settingsSchema } from "@/contracts/settings";

import { FieldError, FormError, inputClass } from "./course-form";
import { Button } from "./ui/button";

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
  // 入力が正しいときに呼ぶ（API に保存する）。保存できなかったときは、画面に出すメッセージを返す
  onSubmit: (settings: Settings) => Promise<string | null>;
};

export function SettingsForm({ initial, onSubmit }: Props) {
  const [errors, setErrors] = useState<Errors>(NO_ERRORS);
  // 保存できなかったときのメッセージ
  const [saveError, setSaveError] = useState<string | null>(null);
  // 保存している間は true（ボタンに回る印を出し、押せないようにする）
  const [pending, setPending] = useState(false);
  const id = useId();
  const periods = [...initial.periods].sort((a, b) => a.period - b.period);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
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
      setSaveError(null);
      return;
    }

    setErrors(NO_ERRORS);
    setSaveError(null);
    setPending(true);
    setSaveError(await onSubmit(parsed.data));
    setPending(false);
  }

  const bufferId = `${id}-buffer`;

  return (
    // noValidate：ブラウザの英語まじりの吹き出しではなく、下の日本語のメッセージで知らせる
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={bufferId} className="text-sm font-semibold">
          移動の余裕時間
        </label>
        <p
          id={`${bufferId}-hint`}
          className="text-muted text-sm [word-break:auto-phrase]"
        >
          授業が始まる何分前に移動を始めるか（0〜60 分）
        </p>
        <div className="flex items-center gap-2">
          <input
            id={bufferId}
            name="travelBufferMinutes"
            type="number"
            inputMode="numeric"
            min={0}
            max={60}
            defaultValue={initial.travelBufferMinutes}
            aria-invalid={errors.travelBufferMinutes ? true : undefined}
            aria-describedby={
              errors.travelBufferMinutes
                ? `${bufferId}-hint ${bufferId}-error`
                : `${bufferId}-hint`
            }
            className={`${inputClass} font-display max-w-24 tabular-nums`}
          />
          <span className="text-sm">分</span>
        </div>
        {errors.travelBufferMinutes && (
          <FieldError id={`${bufferId}-error`}>
            {errors.travelBufferMinutes}
          </FieldError>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">時限の時刻</legend>
        {periods.map(({ period, start, end }) => {
          const error = errors.periods[period];
          const errorId = `${id}-period-${period}-error`;
          const invalidProps = {
            "aria-invalid": error ? true : undefined,
            "aria-describedby": error ? errorId : undefined,
          };
          return (
            <div key={period} className="flex flex-col gap-1">
              <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                <span className="font-display text-base font-semibold whitespace-nowrap tabular-nums">
                  {period}
                  <span className="text-muted ml-0.5 font-sans text-xs font-normal">
                    限
                  </span>
                </span>
                <input
                  name={`start-${period}`}
                  type="time"
                  defaultValue={start}
                  aria-label={`${period}限の開始時刻`}
                  {...invalidProps}
                  className={`${inputClass} px-2! tabular-nums`}
                />
                <span aria-hidden className="text-muted">
                  〜
                </span>
                <input
                  name={`end-${period}`}
                  type="time"
                  defaultValue={end}
                  aria-label={`${period}限の終了時刻`}
                  {...invalidProps}
                  className={`${inputClass} px-2! tabular-nums`}
                />
              </div>
              {error && (
                <div className="pl-12">
                  <FieldError id={errorId}>{error}</FieldError>
                </div>
              )}
            </div>
          );
        })}
      </fieldset>

      {errors.form && <FormError>{errors.form}</FormError>}
      {saveError && <FormError>{saveError}</FormError>}

      <Button type="submit" loading={pending} className="w-full py-3">
        {pending ? "保存しています" : "設定を保存"}
      </Button>
    </form>
  );
}
