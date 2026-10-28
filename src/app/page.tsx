// front 担当のファイル（ホーム画面）。
// いまは開発環境の確認用の仮ページ。ホーム画面の issue で、次の授業や空きコマ提案に置き換える。
import { HealthStatus } from "@/components/health-status";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-6 py-16">
      <div>
        <h1 className="text-2xl font-bold">TOUKOU</h1>
        <p className="mt-1 text-sm opacity-70">
          授業はスキップしても、学びはスキップしない。
        </p>
      </div>
      <section className="rounded border border-current/20 p-4">
        <h2 className="mb-2 font-semibold">開発環境の状態</h2>
        <HealthStatus />
      </section>
    </main>
  );
}
