// front 担当のファイル（問題の確認・公開の画面）。
// AI が作った確認問題を、本人が確認して公開する（#70）。問題は API（/api/questions）から読み込む（#156）。
// 読み込みと表示は questions-screen.tsx（ブラウザで動く部品）が行う。画面は端末の高さに収める。
import type { Metadata } from "next";

import { QuestionsScreen } from "@/components/questions-screen";

export const metadata: Metadata = {
  title: "問題 | TOUKOU",
};

export default function QuestionsPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <QuestionsScreen />
    </main>
  );
}
