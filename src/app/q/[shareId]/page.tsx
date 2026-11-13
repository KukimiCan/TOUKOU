// front 担当のファイル（共有された問題の画面）。
// 友達から送られた URL で開き、ログインせずに問題に回答する（#72）。いまは仮データ（src/mocks/shared-questions-preview.ts）を使う。
// API（GET /api/shared/[shareId]、POST /api/shared/[shareId]/answers）につなぐのは別の issue。
// - ログインの確認をしない（アプリに登録していない人も開ける）
// - 出すのは、作った人が公開した問題文と選択肢だけ。元の板書画像や資料へのリンクは出さない
// URL の [shareId] は、開いたときに初めて分かる値なので、読み込み中の表示（Suspense）の中で読む（Next.js の決まり）。
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { SharedQuestionAnswer } from "@/components/shared-question-answer";
import { mockPreviewSharedQuestion } from "@/mocks/shared-questions-preview";

export const metadata: Metadata = {
  title: "確認問題 | TOUKOU",
};

export default function SharedQuestionPage({
  params,
}: PageProps<"/q/[shareId]">) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-8">
      <header className="flex flex-col gap-1">
        <p className="text-sm font-semibold opacity-70">TOUKOU</p>
        <h1 className="text-2xl font-bold">確認問題</h1>
        <p className="text-sm leading-relaxed opacity-80">
          友達が授業の資料から作った問題です。登録しなくても回答できます。
        </p>
      </header>
      <Suspense
        fallback={
          <p role="status" className="py-12 text-center text-sm opacity-70">
            問題を読み込んでいます…
          </p>
        }
      >
        {params.then(({ shareId }) => (
          <SharedQuestionContent shareId={shareId} />
        ))}
      </Suspense>
    </main>
  );
}

function SharedQuestionContent({ shareId }: { shareId: string }) {
  const question = mockPreviewSharedQuestion(shareId);
  if (!question) notFound();

  return <SharedQuestionAnswer question={question} />;
}
