// front 担当のファイル。
// 資料詳細の画面の中身（#69）。中身の表示は material-detail.tsx が行う。
// - 開いたときに、資料の詳細（GET /api/materials/[id]）と科目（GET /api/courses）を API から読み込む
// - 資料が見つからない（404：無い資料、他人の資料）ときは、一覧へ戻る案内を出す
// - 読み込み中は、画面の形に近い骨格（MaterialDetailSkeleton）を出す。page.tsx と loading.tsx でも同じものを使う
// - 読み込めなかったとき・ログインしていないときは、それぞれの表示を出す
"use client";

import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { coursesResponseSchema } from "@/contracts/courses";
import {
  type MaterialDetailResponse,
  materialDetailResponseSchema,
} from "@/contracts/materials";

import { ApiError, fetchApi } from "./fetch-api";
import { LoadError } from "./load-error";
import { MaterialDetail } from "./material-detail";

// 時間割から消えた科目の資料にも、科目名の代わりに出す
const UNKNOWN_COURSE_NAME = "（時間割に無い科目）";

type Load =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; detail: MaterialDetailResponse; courseName: string };

async function loadMaterial(id: string) {
  const [detailRes, coursesRes] = await Promise.all([
    fetchApi(`/api/materials/${encodeURIComponent(id)}`),
    fetchApi("/api/courses"),
  ]);
  const detail = materialDetailResponseSchema.parse(await detailRes.json());
  const { courses } = coursesResponseSchema.parse(await coursesRes.json());
  const courseName =
    courses.find((c) => c.id === detail.material.courseId)?.name ??
    UNKNOWN_COURSE_NAME;
  return { detail, courseName };
}

export function MaterialDetailScreen({ id }: { id: string }) {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  // 「もう一度読み込む」を押した回数。変わるたびに読み込み直す
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // 読み込みの途中で画面を離れたら、結果を使わない
    let ignore = false;
    loadMaterial(id)
      .then((data) => {
        if (!ignore) setLoad({ status: "ready", ...data });
      })
      .catch((error: unknown) => {
        if (!ignore) setLoad({ status: "error", error });
      });
    return () => {
      ignore = true;
    };
  }, [id, attempt]);

  function retry() {
    setLoad({ status: "loading" });
    setAttempt((n) => n + 1);
  }

  if (load.status === "loading") return <MaterialDetailSkeleton />;

  if (load.status === "error") {
    // 無い資料は、読み込み直しても同じなので、一覧へ戻る案内だけを出す
    if (load.error instanceof ApiError && load.error.status === 404) {
      return (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <FileQuestion
            aria-hidden
            className="text-muted size-8"
            strokeWidth={1.5}
          />
          <div role="alert" className="flex flex-col gap-1">
            <p className="font-semibold">この資料は見つかりませんでした</p>
            <p className="text-muted text-sm [word-break:auto-phrase]">
              削除されたか、別のアカウントの資料かもしれません。
            </p>
          </div>
          <Link
            href="/materials"
            className="border-line bg-surface hover:border-foreground inline-flex items-center border px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors"
          >
            資料の一覧へ
          </Link>
        </div>
      );
    }
    return (
      <LoadError
        error={load.error}
        title="資料を読み込めませんでした"
        loginMessage="ログインすると、資料と AI の解説を確認できます。"
        onRetry={retry}
      />
    );
  }

  return <MaterialDetail detail={load.detail} courseName={load.courseName} />;
}

// 読み込み中の骨格。見出し、元の画像、解説の順に、実際の画面と同じ並びで出す
export function MaterialDetailSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-8">
      <span className="sr-only">資料を読み込んでいます</span>
      <div className="flex flex-col gap-2">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-4 w-32" />
      </div>
      <div className="skeleton h-64 w-full" />
      <div className="flex flex-col gap-3">
        <div className="skeleton h-6 w-28" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-11/12" />
        <div className="skeleton h-4 w-2/3" />
      </div>
    </div>
  );
}
