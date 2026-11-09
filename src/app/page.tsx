// front 担当のファイル（ホーム画面）。
// いまは仮データ（src/mocks/home.ts）で次の授業カードを表示する。API につなぐのは #65。
// 授業が無いときの表示は #63、残り時間は #61、移動開始の目安は #62、空きコマ提案と復習は #64 で足す。
import { HealthStatus } from "@/components/health-status";
import { NextClassCard } from "@/components/next-class-card";
import { mockHomeResponse } from "@/mocks/home";

// 【一時的な処理。#65 で API の値に置き換えたら消す】
// 仮データの開始時刻は過去の日付なので、カウントダウンを確認できるよう「今から 30 分後」に開始する形にずらす。
// Next.js は Date.now() の結果をページに入れるとき、こうした指定（"use cache"）を求める。
// 結果は保存されるので、基準になる「今」はビルドした時刻（その後は既定の 15 分ごとに作り直される）。
async function getPreviewNextClass() {
  "use cache";
  const { nextClass } = mockHomeResponse;
  if (!nextClass) return null;

  const start = Date.now() + 30 * 60_000;
  const length =
    new Date(nextClass.endsAt).getTime() -
    new Date(nextClass.startsAt).getTime();
  return {
    ...nextClass,
    startsAt: new Date(start).toISOString(),
    endsAt: new Date(start + length).toISOString(),
  };
}

export default async function Home() {
  const nextClass = await getPreviewNextClass();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">TOUKOU</h1>
        <p className="mt-1 text-sm opacity-70">
          授業はスキップしても、学びはスキップしない。
        </p>
      </div>

      {nextClass && <NextClassCard nextClass={nextClass} />}

      {/* 開発環境の確認用（docs/getting-started.md と DB の #2 で使う）。不要になったら消す */}
      <section className="mt-8 rounded border border-current/20 p-4 text-sm opacity-70">
        <h2 className="mb-2 font-semibold">開発環境の状態</h2>
        <HealthStatus />
      </section>
    </main>
  );
}
