// front 担当のファイル。
// 問題の画面へ移るあいだに出す表示。見出しは本物と同じものを出し、問題の部分だけ骨格にする
// （読み込みが終わったときに、画面の形が跳ねないようにする）。
import {
  QuestionsHeader,
  QuestionsSkeleton,
} from "@/components/questions-screen";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <QuestionsHeader />
      <QuestionsSkeleton />
    </main>
  );
}
