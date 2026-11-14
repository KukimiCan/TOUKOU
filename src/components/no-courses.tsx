// front 担当のファイル。
// 授業が 1 つも登録されていないとき（API の nextClass が null）のホームの表示（#63）。
// 次の授業カードの代わりに、同じ枠の中に出し、時間割の登録へ案内する（アイコン＋短い文＋ボタン）。
import { ArrowRight, CalendarPlus } from "lucide-react";
import Link from "next/link";

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
          時間割に授業を登録すると、ここに次の授業の場所と、移動を始める時刻が出ます。
        </p>
      </div>
      <Link
        href="/timetable"
        className="bg-foreground text-background hover:bg-foreground/85 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors"
      >
        時間割に授業を登録する
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </section>
  );
}
