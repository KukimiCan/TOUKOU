// front 担当のファイル（共有された問題の画面）。
// 友達から送られた URL で開き、ログインせずに問題に回答する（#72）。問題は API（/api/shared/[shareId]）から読み込む（#156）。
// 読み込みは shared-question-screen.tsx（ブラウザで動く部品）が行う。画面は端末の高さに収める。
// - ログインの確認をしない（アプリに登録していない人も開ける）
// - 出すのは、作った人が公開した問題文と選択肢だけ。元の板書画像や資料へのリンクは出さない
// - TOUKOU を知らない人が開くので、登録せずに解けることを見出しの下に 1 行だけ書く
// URL の [shareId] は、開いたときに初めて分かる値なので、読み込み中の表示（Suspense）の中で読む（Next.js の決まり）。
import type { Metadata } from "next";
import { Suspense } from "react";

import {
  SharedQuestionScreen,
  SharedQuestionSkeleton,
} from "@/components/shared-question-screen";
import { Screen } from "@/components/ui/screen";

export const metadata: Metadata = {
  title: "確認問題 | TOUKOU",
};

export default function SharedQuestionPage({
  params,
}: PageProps<"/q/[shareId]">) {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <Screen
        label="TOUKOU"
        title="確認問題"
        actions={
          <p className="text-muted text-xs whitespace-nowrap">
            登録なしで回答できます
          </p>
        }
      >
        <Suspense fallback={<SharedQuestionSkeleton />}>
          <SharedQuestionContent params={params} />
        </Suspense>
      </Screen>
    </main>
  );
}

async function SharedQuestionContent({
  params,
}: Pick<PageProps<"/q/[shareId]">, "params">) {
  const { shareId } = await params;
  return <SharedQuestionScreen shareId={shareId} />;
}
