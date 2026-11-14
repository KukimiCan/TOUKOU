// front 担当のファイル（解いた問題の履歴の画面）。
// ログイン中に、共有された問題へ回答した履歴を見る。読み込みと表示は answer-history-screen.tsx（ブラウザで動く部品）が行う。
import type { Metadata } from "next";

import { AnswerHistoryScreen } from "@/components/answer-history-screen";

export const metadata: Metadata = {
  title: "解いた問題 | TOUKOU",
};

export default function AnswerHistoryPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <AnswerHistoryScreen />
    </main>
  );
}
