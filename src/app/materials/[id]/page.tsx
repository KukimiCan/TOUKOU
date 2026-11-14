// front 担当のファイル（資料詳細の画面）。
// 元の画像と AI の解説を表示する（#68）。資料は API（/api/materials/[id]）から読み込む（#69）。
// 読み込みは material-detail-screen.tsx（ブラウザで動く部品）が行う。
// URL の [id] と ?generate=1 は、開いたときに初めて分かる値なので、読み込み中の表示（Suspense）の中で読む（Next.js の決まり）。
// ?generate=1 は、板書を送った直後に付く。開いたらそのまま解説を作り始める
import type { Metadata } from "next";
import { Suspense } from "react";

import {
  MaterialDetailScreen,
  MaterialDetailSkeleton,
} from "@/components/material-detail-screen";

export const metadata: Metadata = {
  title: "資料 | TOUKOU",
};

export default function MaterialPage({
  params,
  searchParams,
}: PageProps<"/materials/[id]">) {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <Suspense fallback={<MaterialDetailSkeleton />}>
        <MaterialContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function MaterialContent({
  params,
  searchParams,
}: Pick<PageProps<"/materials/[id]">, "params" | "searchParams">) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  return <MaterialDetailScreen id={id} autoGenerate={query.generate === "1"} />;
}
