// front 担当のファイル。
// 問題の画面へ移るあいだに出す表示。見出しは本物と同じ枠で出し、一覧の部分だけ骨格にする
// （読み込みが終わったときに、画面の形が跳ねないようにする）。
import { QuestionsLoadingScreen } from "@/components/questions-screen";

export default function Loading() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <QuestionsLoadingScreen />
    </main>
  );
}
