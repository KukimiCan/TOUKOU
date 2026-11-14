// front 担当のファイル。
// ホームの「空き時間の過ごし方」（#64）。API の freeTimeSuggestions の時間帯と文を出す。
// back の計算では、空き時間は「いまから移動を始める時刻まで」。
// ホームでは、いちばん近い提案を短く（2 行まで）出し、押すとモーダルで全部の提案を出す（1 画面に収めるため）。
// ホームを開いたまま空き時間の終わりを過ぎたら、その提案は消す（古い提案を残さないため）。
// 提案が 1 つも無いときは、行ごと出さない。
"use client";

import { Hourglass } from "lucide-react";
import { useState } from "react";

import type { FreeTimeSuggestion } from "@/contracts/home";

import { SuggestionRow } from "./suggestion-row";
import { Modal } from "./ui/modal";
import { useClassClock } from "./use-class-clock";

// "2026-11-04T11:50:00+09:00" → "11:50"（日本時間に固定。next-class-card.tsx と同じ）
const timeFormat = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Tokyo",
});
const hm = (iso: string) => timeFormat.format(new Date(iso));

export function FreeTimeSuggestions({
  suggestions,
}: {
  suggestions: FreeTimeSuggestion[];
}) {
  const [open, setOpen] = useState(false);
  const now = useClassClock();
  // 時計が動き出すまで（画面に出る前）は、すべて出しておく
  const current =
    now === null
      ? suggestions
      : suggestions.filter((s) => new Date(s.endsAt).getTime() > now);
  if (current.length === 0) return null;

  const first = current[0];
  return (
    <div>
      <SuggestionRow
        icon={<Hourglass aria-hidden />}
        label="空き時間の過ごし方"
        meta={
          <>
            {hm(first.startsAt)}–{hm(first.endsAt)}
            {current.length > 1 && (
              <span className="text-muted ml-1.5 font-sans text-xs">
                ほか {current.length - 1} 件
              </span>
            )}
          </>
        }
        summary={first.text}
        onOpen={() => setOpen(true)}
      />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="空き時間の過ごし方"
      >
        {/* 左に時刻、右に過ごし方。時刻の列をそろえる */}
        <ul className="divide-line -my-4 divide-y">
          {current.map((s) => (
            <li key={s.startsAt} className="flex gap-4 py-4">
              <p className="font-display w-14 shrink-0 leading-tight tracking-wide tabular-nums">
                <span className="block text-lg font-semibold">
                  {hm(s.startsAt)}
                </span>
                <span className="text-muted block text-sm">
                  <span className="sr-only">から</span>– {hm(s.endsAt)}
                </span>
              </p>
              <p className="leading-relaxed [word-break:auto-phrase]">
                {s.text}
              </p>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
