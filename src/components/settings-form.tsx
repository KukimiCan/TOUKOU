// front 担当のファイル。
// 時間割の設定の入力フォーム（時限の時刻と、移動の余裕時間）（#58）。
// 時限ごとに開始・終了を入れさせず、4 つの値から全部の時限の時刻を計算する：
//   「1 限の開始時刻」「授業の長さ（分）」「休み時間（分）」「昼休み（何限の後に、何分）」
// - 計算した時刻は、入力のすぐ下に一覧で見せる（値を変えた瞬間に更新する）
// - 時限の数は、いま保存されている数（初期は 8）のまま
// - 開いたときは、保存されている時刻から 4 つの値を逆算して入れておく。
//   一定の間隔でない時刻のときは、保存されている時刻をそのまま見せ、4 つの値を変えたら計算した時刻で置き換える
// - 保存は、今と同じ形（periods の配列）で送る。入力は contracts の zod スキーマ（settingsSchema）でもチェックする
// 保存している間はボタンに回る印を出し、保存できなかったときはメッセージを出す（#59）。
// 入力欄・エラーの見た目は、科目のフォーム（course-form.tsx）とそろえる。
"use client";

import { Info } from "lucide-react";
import { useId, useState } from "react";

import {
  type PeriodTime,
  type Settings,
  settingsSchema,
} from "@/contracts/settings";

import { FieldError, FormError, inputClass } from "./course-form";
import { Button } from "./ui/button";

// 時限の時刻を決める 4 つの値（分は数）
type Pattern = {
  start: string;
  duration: number;
  breakMinutes: number;
  // 昼休みを入れる時限（その時限の後に入る）。0 は「なし」
  lunchAfter: number;
  lunchMinutes: number;
};

// 入力欄の値（入力の途中は空や数字でない値もあるので、文字のまま持つ）
type Values = {
  start: string;
  duration: string;
  breakMinutes: string;
  lunchAfter: string;
  lunchMinutes: string;
  travelBufferMinutes: string;
};

type FieldName = keyof Values;

const DAY_MINUTES = 24 * 60;

function toMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function toTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// 4 つの値から、時限ごとの開始・終了を計算する。24 時を過ぎるときは null
function computePeriods(
  numbers: number[],
  pattern: Pattern,
): PeriodTime[] | null {
  let at = toMinutes(pattern.start);
  const periods: PeriodTime[] = [];
  for (const period of numbers) {
    const end = at + pattern.duration;
    if (end >= DAY_MINUTES) return null;
    periods.push({ period, start: toTime(at), end: toTime(end) });
    at =
      end +
      (period === pattern.lunchAfter
        ? pattern.lunchMinutes
        : pattern.breakMinutes);
  }
  return periods;
}

// 保存されている時刻から 4 つの値を逆算する。
// regular が false のときは、4 つの値で同じ時刻を作れない（授業の長さがばらばら、など）
function inferPattern(sorted: PeriodTime[]): {
  pattern: Pattern;
  regular: boolean;
} {
  const fallback: Pattern = {
    start: "09:00",
    duration: 90,
    breakMinutes: 10,
    lunchAfter: 2,
    lunchMinutes: 60,
  };
  if (sorted.length === 0) return { pattern: fallback, regular: false };

  const durations = sorted.map((p) => toMinutes(p.end) - toMinutes(p.start));
  const gaps = sorted
    .slice(1)
    .map((p, i) => toMinutes(p.start) - toMinutes(sorted[i].end));

  // いちばん多い間隔を休み時間にする（同じ数なら短いほう）
  const counts = new Map<number, number>();
  for (const gap of gaps) counts.set(gap, (counts.get(gap) ?? 0) + 1);
  const breakMinutes =
    [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]?.[0] ??
    fallback.breakMinutes;

  // 休み時間より長い間隔を昼休みにする（いちばん長いもの）
  let lunchIndex = -1;
  gaps.forEach((gap, i) => {
    if (gap > breakMinutes && (lunchIndex < 0 || gap > gaps[lunchIndex])) {
      lunchIndex = i;
    }
  });

  const pattern: Pattern = {
    start: sorted[0].start,
    duration: durations[0],
    breakMinutes: Math.max(0, breakMinutes),
    lunchAfter: lunchIndex >= 0 ? sorted[lunchIndex].period : 0,
    lunchMinutes: lunchIndex >= 0 ? gaps[lunchIndex] : fallback.lunchMinutes,
  };

  // 逆算した値で計算し直して、保存されている時刻と同じになれば「一定の間隔」
  const recomputed = computePeriods(
    sorted.map((p) => p.period),
    pattern,
  );
  const regular =
    recomputed !== null &&
    recomputed.every(
      (p, i) => p.start === sorted[i].start && p.end === sorted[i].end,
    );
  return { pattern, regular };
}

// 0 以上の整数か（空欄は「数字ではない」として扱う）
function parseIntIn(text: string, min: number, max: number) {
  if (!/^\d+$/.test(text.trim())) return null;
  const n = Number(text);
  return n >= min && n <= max ? n : null;
}

// 入力欄の値を確かめ、時限の時刻を計算する。エラーは項目ごとに日本語で返す
function evaluate(values: Values, numbers: number[]) {
  const errors: Partial<Record<FieldName | "overflow", string>> = {};
  const start = /^([01]\d|2[0-3]):[0-5]\d$/.test(values.start)
    ? values.start
    : null;
  if (!start) errors.start = "時刻を入力してください";
  const duration = parseIntIn(values.duration, 10, 240);
  if (duration === null) errors.duration = "10〜240 で入力";
  const breakMinutes = parseIntIn(values.breakMinutes, 0, 120);
  if (breakMinutes === null) errors.breakMinutes = "0〜120 で入力";
  const lunchAfter = Number(values.lunchAfter);
  const lunchMinutes =
    lunchAfter === 0 ? 0 : parseIntIn(values.lunchMinutes, 0, 180);
  if (lunchMinutes === null) errors.lunchMinutes = "0〜180 で入力";
  const buffer = parseIntIn(values.travelBufferMinutes, 0, 60);
  if (buffer === null) {
    errors.travelBufferMinutes = "0〜60 の整数で入力してください";
  }

  let periods: PeriodTime[] | null = null;
  if (
    start &&
    duration !== null &&
    breakMinutes !== null &&
    lunchMinutes !== null
  ) {
    periods = computePeriods(numbers, {
      start,
      duration,
      breakMinutes,
      lunchAfter,
      lunchMinutes,
    });
    if (!periods) {
      errors.overflow =
        "最後の時限が 24 時を過ぎます。開始時刻か長さを見直してください。";
    }
  }
  return { errors, periods, buffer };
}

type Props = {
  // 最初に入れておく値（いまの設定）
  initial: Settings;
  // 入力が正しいときに呼ぶ（API に保存する）。保存できなかったときは、画面に出すメッセージを返す
  onSubmit: (settings: Settings) => Promise<string | null>;
};

export function SettingsForm({ initial, onSubmit }: Props) {
  const id = useId();
  const saved = [...initial.periods].sort((a, b) => a.period - b.period);
  const numbers = saved.map((p) => p.period);
  // 開いたときの 4 つの値（保存されている時刻から逆算する）
  const [{ pattern, regular }] = useState(() => inferPattern(saved));

  const [values, setValues] = useState<Values>({
    start: pattern.start,
    duration: String(pattern.duration),
    breakMinutes: String(pattern.breakMinutes),
    lunchAfter: String(pattern.lunchAfter),
    lunchMinutes: String(pattern.lunchMinutes),
    travelBufferMinutes: String(initial.travelBufferMinutes),
  });
  // 時刻の 4 つの値を変えたか（一定の間隔でない時刻は、変えるまで保存されている時刻を使う）
  const [changed, setChanged] = useState(false);
  // 一度でも保存を押したか（押す前は、空欄のエラーを出さない）
  const [submitted, setSubmitted] = useState(false);
  // 保存できなかったときのメッセージ
  const [saveError, setSaveError] = useState<string | null>(null);
  // 保存している間は true（ボタンに回る印を出し、押せないようにする）
  const [pending, setPending] = useState(false);

  const { errors, periods: computed, buffer } = evaluate(values, numbers);
  const keepSaved = !regular && !changed;
  const periods = keepSaved ? saved : computed;
  // 時刻のエラーは、保存されている時刻をそのまま使うときは出さない
  const timeErrors = keepSaved ? {} : errors;

  function set(name: FieldName, value: string) {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (name !== "travelBufferMinutes") setChanged(true);
  }

  // 入力の途中で、空欄のエラーが出続けないようにする（保存を押したあとは出す）
  const shown = (name: FieldName) =>
    submitted || values[name] !== "" ? timeErrors[name] : undefined;
  const bufferError =
    submitted || values.travelBufferMinutes !== ""
      ? errors.travelBufferMinutes
      : undefined;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setSubmitted(true);
    setSaveError(null);
    if (!periods || buffer === null) return;

    const parsed = settingsSchema.safeParse({
      travelBufferMinutes: buffer,
      periods,
    });
    if (!parsed.success) {
      setSaveError(
        parsed.error.issues[0]?.message ?? "入力の内容を確かめてください。",
      );
      return;
    }

    setPending(true);
    setSaveError(await onSubmit(parsed.data));
    setPending(false);
  }

  // 入力欄の共通の属性（ラベル・エラーの文とつなぐ）
  const fieldProps = (name: FieldName, error?: string) => ({
    id: `${id}-${name}`,
    name,
    value: values[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      set(name, e.target.value),
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-${name}-error` : undefined,
  });

  const numberClass = `${inputClass} font-display w-16! px-2! text-right tabular-nums`;
  const lunchOff = values.lunchAfter === "0";
  const half = Math.ceil(numbers.length / 2);

  return (
    // noValidate：ブラウザの英語まじりの吹き出しではなく、下の日本語のメッセージで知らせる
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-bold">時限の時刻</legend>

        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-4 gap-y-3">
          <Field
            htmlFor={`${id}-start`}
            label="1 限の開始"
            error={shown("start")}
            errorId={`${id}-start-error`}
          >
            <input
              type="time"
              {...fieldProps("start", shown("start"))}
              className={`${inputClass} font-display px-2! tabular-nums`}
            />
          </Field>
          <Field
            htmlFor={`${id}-duration`}
            label="授業の長さ"
            error={shown("duration")}
            errorId={`${id}-duration-error`}
          >
            <Minutes>
              <input
                type="number"
                inputMode="numeric"
                min={10}
                max={240}
                {...fieldProps("duration", shown("duration"))}
                className={numberClass}
              />
            </Minutes>
          </Field>
          <Field
            htmlFor={`${id}-breakMinutes`}
            label="休み時間"
            error={shown("breakMinutes")}
            errorId={`${id}-breakMinutes-error`}
          >
            <Minutes>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={120}
                {...fieldProps("breakMinutes", shown("breakMinutes"))}
                className={numberClass}
              />
            </Minutes>
          </Field>
          <Field
            htmlFor={`${id}-lunchAfter`}
            label="昼休み"
            className="col-span-3"
            error={shown("lunchMinutes")}
            errorId={`${id}-lunchMinutes-error`}
          >
            <div className="flex items-center gap-2">
              <select
                {...fieldProps("lunchAfter")}
                className={`${inputClass} w-auto! pr-8!`}
              >
                <option value="0">なし</option>
                {numbers.slice(0, -1).map((n) => (
                  <option key={n} value={n}>
                    {n}限の後
                  </option>
                ))}
              </select>
              {!lunchOff && (
                <Minutes>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={180}
                    aria-label="昼休みの長さ（分）"
                    {...fieldProps("lunchMinutes", shown("lunchMinutes"))}
                    className={numberClass}
                  />
                </Minutes>
              )}
            </div>
          </Field>
        </div>

        {keepSaved && (
          <p className="text-muted flex items-start gap-1.5 text-sm [word-break:auto-phrase]">
            <Info aria-hidden className="mt-[0.2em] size-4 shrink-0" />
            <span>
              いまの時刻は一定の間隔ではありません。
              <wbr />
              上の値を変えると、計算した時刻で置き換えます。
            </span>
          </p>
        )}

        {/* 計算した時刻の一覧（値を変えた瞬間に更新する）。左の列に前半、右の列に後半を並べる */}
        <div className="bg-background border-line border px-3 py-2">
          {periods ? (
            <ol
              aria-label="各時限の時刻"
              className="font-display grid grid-flow-col gap-x-6 tabular-nums"
              style={{ gridTemplateRows: `repeat(${half}, auto)` }}
            >
              {periods.map(({ period, start, end }) => (
                <li
                  key={period}
                  className="flex items-baseline gap-2.5 leading-7"
                >
                  <span className="w-3 text-right font-semibold">
                    {period}
                    <span className="sr-only">限</span>
                  </span>
                  <span className="whitespace-nowrap">
                    {start}
                    <span className="text-muted px-0.5">–</span>
                    {end}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p
              role={errors.overflow ? "alert" : undefined}
              className={`py-1 text-sm [word-break:auto-phrase] ${
                errors.overflow ? "text-danger" : "text-muted"
              }`}
            >
              {errors.overflow ?? "値を入れると、各時限の時刻を計算します。"}
            </p>
          )}
        </div>
      </fieldset>

      <div className="border-line flex flex-col gap-1.5 border-t pt-4">
        <div className="flex items-center justify-between gap-3">
          <label
            htmlFor={`${id}-travelBufferMinutes`}
            className="flex flex-col"
          >
            <span className="text-sm font-bold">移動の余裕時間</span>
            <span
              id={`${id}-buffer-hint`}
              className="text-muted text-xs [word-break:auto-phrase]"
            >
              授業の何分前に移動を始めるか
            </span>
          </label>
          <Minutes>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={60}
              {...fieldProps("travelBufferMinutes", bufferError)}
              className={numberClass}
            />
          </Minutes>
        </div>
        {bufferError && (
          <FieldError id={`${id}-travelBufferMinutes-error`}>
            {bufferError}
          </FieldError>
        )}
      </div>

      {saveError && <FormError>{saveError}</FormError>}

      <Button type="submit" loading={pending} className="w-full py-3">
        {pending ? "保存しています" : "設定を保存"}
      </Button>
    </form>
  );
}

// 数の入力欄の右に「分」を添える
function Minutes({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5">
      {children}
      <span aria-hidden className="text-muted text-sm">
        分
      </span>
    </span>
  );
}

// ラベル + 入力欄 + エラーの 1 項目
function Field({
  htmlFor,
  label,
  error,
  errorId,
  className = "",
  children,
}: {
  htmlFor: string;
  label: string;
  error?: string;
  errorId: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="text-muted text-xs font-bold whitespace-nowrap"
      >
        {label}
      </label>
      {children}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
