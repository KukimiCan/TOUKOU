// front 担当のファイル（問題の確認・公開の画面）。
// AI が作った確認問題を、本人が確認して公開する（#70）。問題は API（/api/questions）から読み込む（#156）。
// 読み込みは questions-screen.tsx（ブラウザで動く部品）が行う。
import type { Metadata } from "next";

import { QuestionsScreen } from "@/components/questions-screen";

export const metadata: Metadata = {
  title: "問題 | TOUKOU",
};

export default function QuestionsPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-bold">問題</h1>
      <p className="text-sm leading-relaxed opacity-80">
        AI
        が資料から作った確認問題です。問題文と解説を確かめてから公開すると、URL
        で友達に送れます。
      </p>
      <QuestionsScreen />
    </main>
  );
}
