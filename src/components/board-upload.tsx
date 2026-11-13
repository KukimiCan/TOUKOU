// front 担当のファイル。
// 板書の撮影・アップロード（#66）。資料一覧（/materials）の上に置く。
// 1. 「カメラで撮る」か「写真を選ぶ」で画像を選ぶ
//    （capture を付けた入力欄はカメラしか開かないので、写真を選ぶ用の入力欄を別に置く）
// 2. 送る前に縮小した画像をプレビューし、科目を選ぶ
// 3. 「アップロードする」を押すと、送っている間は「アップロードしています…」と出し、終わったら資料の詳細へ移る
// 画像は API（POST /api/materials）に送る（#69）。
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { Course } from "@/contracts/courses";
import {
  type MaterialResponse,
  materialResponseSchema,
  uploadMaterialFieldsSchema,
} from "@/contracts/materials";

import { errorMessage, fetchApi } from "./fetch-api";
import { ImageError, resizeImage } from "./resize-image";

type Props = {
  // 科目を選ぶための、時間割の科目
  courses: Course[];
};

// 画像と項目（file / courseId / kind）を FormData で送り、追加された資料を受け取る
async function upload(body: FormData): Promise<MaterialResponse> {
  const res = await fetchApi("/api/materials", { method: "POST", body });
  return materialResponseSchema.parse(await res.json());
}

// 選んだ画像（縮小したもの）と、プレビュー用の URL
type Picked = { file: File; previewUrl: string };

const buttonClass =
  "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded px-2 py-3 font-semibold whitespace-nowrap";

export function BoardUpload({ courses }: Props) {
  const router = useRouter();
  const [picked, setPicked] = useState<Picked | null>(null);
  // 画像を縮小している間は true
  const [preparing, setPreparing] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // プレビュー用の URL は、使い終わったら片付ける（ブラウザのメモリを空けるため）
  useEffect(() => {
    if (!picked) return;
    return () => URL.revokeObjectURL(picked.previewUrl);
  }, [picked]);

  async function handlePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // 同じ写真をもう一度選んでも反応するよう、入力欄を空にしておく
    event.target.value = "";
    if (!file) return;

    setError(null);
    setPreparing(true);
    try {
      const resized = await resizeImage(file);
      setPicked({ file: resized, previewUrl: URL.createObjectURL(resized) });
    } catch (e) {
      setError(
        e instanceof ImageError ? e.message : "画像を準備できませんでした。",
      );
    } finally {
      setPreparing(false);
    }
  }

  function reset() {
    setPicked(null);
    setError(null);
  }

  async function handleUpload() {
    if (!picked || uploading) return;
    const fields = uploadMaterialFieldsSchema.safeParse({
      courseId,
      kind: "board",
    });
    if (!fields.success) {
      setError("科目を選んでください。");
      return;
    }

    const body = new FormData();
    body.append("file", picked.file);
    body.append("courseId", fields.data.courseId);
    body.append("kind", fields.data.kind);

    setError(null);
    setUploading(true);
    try {
      const { material } = await upload(body);
      router.push(`/materials/${material.id}`);
      // 移るまでの間も「アップロードしています…」のままにする
    } catch (e) {
      setError(`アップロードできませんでした。${errorMessage(e)}`);
      setUploading(false);
    }
  }

  if (courses.length === 0) {
    return (
      <section className="flex flex-col gap-2 rounded border border-current/20 p-4 text-sm">
        <p>板書を追加するには、先に時間割に科目を登録してください。</p>
        <Link href="/timetable" className="self-start underline">
          時間割へ
        </Link>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded border border-current/20 p-4">
      <h2 className="font-semibold">板書を追加</h2>

      {!picked ? (
        <div className="flex gap-2">
          <label
            className={`${buttonClass} bg-foreground text-background ${preparing ? "pointer-events-none opacity-50" : ""}`}
          >
            <CameraIcon />
            カメラで撮る
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePick}
              disabled={preparing}
              className="sr-only"
            />
          </label>
          <label
            className={`${buttonClass} border border-current/30 ${preparing ? "pointer-events-none opacity-50" : ""}`}
          >
            写真を選ぶ
            <input
              type="file"
              accept="image/*"
              onChange={handlePick}
              disabled={preparing}
              className="sr-only"
            />
          </label>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- 選んだ画像はまだ送っていないので、ブラウザの中の URL を直接出す */}
          <img
            src={picked.previewUrl}
            alt="アップロードする板書のプレビュー"
            className="max-h-[40vh] w-full rounded border border-current/20 bg-current/5 object-contain"
          />

          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold">どの科目の板書ですか</span>
            <select
              value={courseId}
              onChange={(event) => {
                setCourseId(event.target.value);
                setError(null);
              }}
              disabled={uploading}
              className="rounded border border-current/30 bg-transparent px-3 py-3"
            >
              <option value="" disabled>
                選んでください
              </option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
            className="bg-foreground text-background rounded px-4 py-3 font-semibold disabled:opacity-50"
          >
            {uploading ? "アップロードしています…" : "アップロードする"}
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={uploading}
            className="rounded border border-current/30 px-4 py-3 font-semibold disabled:opacity-50"
          >
            選び直す
          </button>
        </div>
      )}

      {preparing && (
        <p role="status" className="text-center text-sm opacity-70">
          画像を準備しています…
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}

function CameraIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
