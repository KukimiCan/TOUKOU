// front 担当のファイル（ホーム画面）。
// いまは仮データ（src/mocks/home.ts）で次の授業カードを表示する。API につなぐのは #65。
// 仮データを mockHomeResponseTomorrow（次の授業が明日）や mockHomeResponseNoClass（授業が未登録）に
// 差し替えると、授業が無い日の表示（#63）を確認できる。
// 授業中の表示は #61、空きコマ提案と復習は #64 で足す。
import { HealthStatus } from "@/components/health-status";
import { NextClassCard } from "@/components/next-class-card";
import { NoCourses } from "@/components/no-courses";
import { mockHomeResponse } from "@/mocks/home";

export default function Home() {
  const { nextClass } = mockHomeResponse;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">TOUKOU</h1>
        <p className="mt-1 text-sm opacity-70">
          授業はスキップしても、学びはスキップしない。
        </p>
      </div>

      {nextClass ? <NextClassCard nextClass={nextClass} /> : <NoCourses />}

      {/* 開発環境の確認用（docs/getting-started.md と DB の #2 で使う）。不要になったら消す */}
      <section className="mt-8 rounded border border-current/20 p-4 text-sm opacity-70">
        <h2 className="mb-2 font-semibold">開発環境の状態</h2>
        <HealthStatus />
      </section>
    </main>
  );
}
