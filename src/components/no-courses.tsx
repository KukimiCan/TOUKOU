// front 担当のファイル。
// 授業が 1 つも登録されていないとき（API の nextClass が null）のホームの表示（#63）。
// 次の授業カードの代わりに出し、時間割の登録へ案内する。
import Link from "next/link";

export function NoCourses() {
  return (
    <section className="flex flex-col gap-3">
      <p className="text-2xl font-bold">授業がまだ登録されていません</p>
      <p className="text-sm opacity-70">
        時間割に授業を登録すると、ここに次の授業の場所と、移動を始める時刻が出ます。
      </p>
      <Link href="/timetable" className="text-base font-semibold underline">
        時間割に授業を登録する
      </Link>
    </section>
  );
}
