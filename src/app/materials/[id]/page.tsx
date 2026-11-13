// front 担当のファイル（資料詳細の画面）。
// 元の画像と AI の解説を並べて表示する（#68）。資料は API（/api/materials/[id]）から読み込む（#69）。
// 読み込みは material-detail-screen.tsx（ブラウザで動く部品）が行う。
// URL の [id] は、開いたときに初めて分かる値なので、読み込み中の表示（Suspense）の中で読む（Next.js の決まり）。
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { MaterialDetailScreen } from "@/components/material-detail-screen";

export const metadata: Metadata = {
  title: "資料 | TOUKOU",
};

export default function MaterialPage({ params }: PageProps<"/materials/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 px-4 py-8">
      <Link href="/materials" className="self-start text-sm underline">
        資料の一覧へ戻る
      </Link>
      <Suspense
        fallback={
          <p role="status" className="py-12 text-center text-sm opacity-70">
            資料を読み込んでいます…
          </p>
        }
      >
        <MaterialContent params={params} />
      </Suspense>
    </main>
  );
}

async function MaterialContent({
  params,
}: Pick<PageProps<"/materials/[id]">, "params">) {
  const { id } = await params;
  return <MaterialDetailScreen id={id} />;
}
