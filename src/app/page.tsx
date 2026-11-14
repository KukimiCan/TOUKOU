// front 担当のファイル（ホーム画面）。
// 中身（次の授業カード、空き時間の過ごし方、短い復習）は、/api/home から取得して出す（#65）。
// 取得と、読み込み中・エラーの表示は src/components/home-content.tsx にある。
// ナビで「ホーム」と分かるので、h1 は読み上げ用だけにし、次の授業カードを画面の上に寄せる。
import { HealthStatus } from "@/components/health-status";
import { HomeContent, TodayLabel } from "@/components/home-content";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-0.5">
        <h1 className="sr-only">ホーム</h1>
        <TodayLabel />
        <p className="text-muted text-sm [word-break:auto-phrase]">
          授業はスキップしても、学びはスキップしない。
        </p>
      </header>

      <HomeContent />

      {/* 開発環境の確認用。利用者の画面には出さない */}
      {process.env.NODE_ENV === "development" && (
        <section className="border-line text-muted mt-8 border-t pt-4 text-sm">
          <h2 className="mb-2 font-semibold">開発環境の状態</h2>
          <HealthStatus />
        </section>
      )}
    </div>
  );
}
