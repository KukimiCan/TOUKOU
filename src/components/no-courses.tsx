// front 担当のファイル。
// 授業が 1 つも登録されていないとき（API の nextClass が null）のホームの表示（#63）。
// 次の授業カードの代わりに、同じ枠の中に出し、時間割の登録へ案内する（アイコン＋短い文＋ボタン）。
import { CalendarPlus } from "lucide-react";

import { ButtonLink } from "./ui/button-link";

export function NoCourses() {
  return (
    <section
      aria-labelledby="no-courses-title"
      className="border-line bg-surface flex flex-col items-start gap-4 border px-5 py-6"
    >
      <span
        aria-hidden
        className="bg-accent-soft text-accent flex size-11 items-center justify-center rounded-full"
      >
        <CalendarPlus className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <h2 id="no-courses-title" className="text-lg">
          授業がまだ登録されていません
        </h2>
        <p className="text-muted text-sm [word-break:auto-phrase]">
          時間割に登録すると、次の授業の教室と、出発の目安がここに出ます。
        </p>
      </div>
      <ButtonLink href="/timetable">時間割に授業を登録する</ButtonLink>
    </section>
  );
}
