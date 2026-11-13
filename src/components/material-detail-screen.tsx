// front 担当のファイル。
// 資料詳細の画面の中身（#69）。中身の表示は material-detail.tsx が行う。
// - 開いたときに、資料の詳細（GET /api/materials/[id]）と科目（GET /api/courses）を API から読み込む
// - 資料が見つからない（404：無い資料、他人の資料）ときは、一覧へ戻る案内を出す
// - 読み込み中・読み込めなかったとき・ログインしていないときは、それぞれの表示を出す
"use client";

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

  if (load.status === "loading") {
    return (
      <p role="status" className="py-12 text-center text-sm opacity-70">
        資料を読み込んでいます…
      </p>
    );
  }

  if (load.status === "error") {
    // 無い資料は、読み込み直しても同じなので、一覧へ戻る案内だけを出す
    if (load.error instanceof ApiError && load.error.status === 404) {
      return (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p role="alert">この資料は見つかりませんでした。</p>
          <Link
            href="/materials"
            className="rounded border border-current/30 px-6 py-3 font-semibold"
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
