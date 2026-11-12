// front 担当のファイル（資料詳細の画面）。
// 元の画像と AI の解説を並べて表示する（#68）。いまは仮データ（src/mocks/materials-preview.ts）を使う。
// API（/api/materials/[id]）につなぐのは #69。
// URL の [id] は、開いたときに初めて分かる値なので、読み込み中の表示（Suspense）の中で読む（Next.js の決まり）。
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { MaterialDetail } from "@/components/material-detail";
import {
  mockPreviewCourses,
  mockPreviewMaterialDetail,
} from "@/mocks/materials-preview";

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
        {params.then(({ id }) => (
          <MaterialContent id={id} />
        ))}
      </Suspense>
    </main>
  );
}

function MaterialContent({ id }: { id: string }) {
  const detail = mockPreviewMaterialDetail(id);
  if (!detail) notFound();

  const courseName =
    mockPreviewCourses.find((c) => c.id === detail.material.courseId)?.name ??
    "（時間割に無い科目）";

  return <MaterialDetail detail={detail} courseName={courseName} />;
}
