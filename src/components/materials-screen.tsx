// front 担当のファイル。
// 資料一覧の画面の中身（#69）。板書のアップロード欄（board-upload.tsx）と、資料一覧（materials-list.tsx）をまとめる。
// - 開いたときに、資料（GET /api/materials）と科目（GET /api/courses）を API から読み込む
// - 読み込み中は、画面の形に近い骨格（MaterialsSkeleton）を出す。loading.tsx でも同じものを使う
// - 読み込めなかったとき・ログインしていないときは、それぞれの表示を出す
"use client";

import { useEffect, useState } from "react";

import { type Course, coursesResponseSchema } from "@/contracts/courses";
import { type Material, materialsResponseSchema } from "@/contracts/materials";

import { BoardUpload } from "./board-upload";
import { fetchApi } from "./fetch-api";
import { LoadError } from "./load-error";
import { MaterialsList } from "./materials-list";

type Load =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; materials: Material[]; courses: Course[] };

// 資料と科目を同時に読み込む（科目は、科目名の表示と絞り込み・アップロード先の選択に使う）
async function loadMaterials() {
  const [materialsRes, coursesRes] = await Promise.all([
    fetchApi("/api/materials"),
    fetchApi("/api/courses"),
  ]);
  const { materials } = materialsResponseSchema.parse(
    await materialsRes.json(),
  );
  const { courses } = coursesResponseSchema.parse(await coursesRes.json());
  return { materials, courses };
}

export function MaterialsScreen() {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  // 「もう一度読み込む」を押した回数。変わるたびに読み込み直す
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // 読み込みの途中で画面を離れたら、結果を使わない
    let ignore = false;
    loadMaterials()
      .then((data) => {
        if (!ignore) setLoad({ status: "ready", ...data });
      })
      .catch((error: unknown) => {
        if (!ignore) setLoad({ status: "error", error });
      });
    return () => {
      ignore = true;
    };
  }, [attempt]);

  function retry() {
    setLoad({ status: "loading" });
    setAttempt((n) => n + 1);
  }

  if (load.status === "loading") return <MaterialsSkeleton />;

  if (load.status === "error") {
    return (
      <LoadError
        error={load.error}
        title="資料を読み込めませんでした"
        loginMessage="ログインすると、板書を追加したり、資料を確認したりできます。"
        onRetry={retry}
      />
    );
  }

  return (
    <>
      <BoardUpload courses={load.courses} />
      <MaterialsList materials={load.materials} courses={load.courses} />
    </>
  );
}

// 読み込み中の骨格。上に板書の追加欄、下に資料の行を 3 つ
export function MaterialsSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-8">
      <span className="sr-only">資料を読み込んでいます</span>
      <div className="border-line flex flex-col gap-4 rounded-sm border p-4">
        <div className="skeleton h-5 w-28" />
        <div className="flex gap-2">
          <div className="skeleton h-11 flex-1" />
          <div className="skeleton h-11 flex-1" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="skeleton h-5 w-40" />
        <div className="divide-line border-line flex flex-col divide-y border-y">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="skeleton size-9" />
              <div className="flex flex-1 flex-col gap-1.5">
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-3 w-24" />
              </div>
              <div className="skeleton h-5 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
