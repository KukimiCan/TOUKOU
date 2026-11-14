// front 担当のファイル。
// ホームの「空き時間の過ごし方」の欄（#64）。API の freeTimeSuggestions の時間帯と文を出す。
// back の計算では、空き時間は「いまから移動を始める時刻まで」。
// ホームを開いたまま空き時間の終わりを過ぎたら、その提案は消す（古い提案を残さないため）。
// 提案が 1 つも無いときは、欄ごと出さない。見出しの先頭に「提案」のチップを付ける。
// カードで囲まず、見出しと罫線で区切る。左に時刻、右に過ごし方を並べ、時刻の列をそろえる。
"use client";

import type { FreeTimeSuggestion } from "@/contracts/home";

import { SuggestionChip } from "./suggestion-chip";
import { useClassClock } from "./use-class-clock";

// "2026-11-04T11:50:00+09:00" → "11:50"（日本時間に固定。next-class-card.tsx と同じ）
const timeFormat = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tokyo",
});

export function FreeTimeSuggestions({
  suggestions,
}: {
  suggestions: FreeTimeSuggestion[];
}) {
  const now = useClassClock();
  // 時計が動き出すまで（画面に出る前）は、すべて出しておく
  const current =
    now === null
      ? suggestions
      : suggestions.filter((s) => new Date(s.endsAt).getTime() > now);
  if (current.length === 0) return null;

  return (
    <section aria-labelledby="free-time-title" className="flex flex-col">
      <h2
        id="free-time-title"
        className="border-line flex items-center gap-2 border-b pb-2.5 text-base"
      >
        <SuggestionChip />
        空き時間の過ごし方
      </h2>
      <ul className="divide-line divide-y">
        {current.map((s) => (
          <li key={s.startsAt} className="flex gap-4 py-4">
            <p className="font-display w-14 shrink-0 leading-tight tracking-wide tabular-nums">
              <span className="block text-lg font-semibold">
                {timeFormat.format(new Date(s.startsAt))}
              </span>
              <span className="text-muted block text-sm">
                <span className="sr-only">から</span>–{" "}
                {timeFormat.format(new Date(s.endsAt))}
              </span>
            </p>
            <p className="leading-relaxed [word-break:auto-phrase]">{s.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
