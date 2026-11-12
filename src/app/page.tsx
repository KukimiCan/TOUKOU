// front 担当のファイル（ホーム画面）。
// 中身（次の授業カード、空き時間の過ごし方、短い復習）は、/api/home から取得して出す（#65）。
// 取得と、読み込み中・エラーの表示は src/components/home-content.tsx にある。
import { HealthStatus } from "@/components/health-status";
import { HomeContent } from "@/components/home-content";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">TOUKOU</h1>
        <p className="mt-1 text-sm opacity-70">
          授業はスキップしても、学びはスキップしない。
        </p>
      </div>

      <HomeContent />

      {/* 開発環境の確認用（docs/getting-started.md と DB の #2 で使う）。不要になったら消す */}
      <section className="mt-8 rounded border border-current/20 p-4 text-sm opacity-70">
        <h2 className="mb-2 font-semibold">開発環境の状態</h2>
        <HealthStatus />
      </section>
    </main>
  );
}
