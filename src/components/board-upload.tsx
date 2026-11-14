// front 担当のファイル。
// 板書の撮影・アップロード（#66）。資料一覧（/materials）の上に置く。
// 1. 「カメラで撮る」か「写真を選ぶ」で画像を選ぶ
//    （capture を付けた入力欄はカメラしか開かないので、写真を選ぶ用の入力欄を別に置く）
// 2. 送る前に縮小した画像をプレビューし、科目を選ぶ（科目が 1 つだけなら最初から選んでおく）
// 3. 「アップロードする」を押すと、送っている間はボタンに回る印と、画像の上に進行中の線を出し、終わったら資料の詳細へ移る
// 失敗したときは、理由（形式・大きさ・通信）を見出しで分けて出す。
// 画像は API（POST /api/materials）に送る（#69）。
"use client";

import {
  CalendarPlus,
  Camera,
  CircleAlert,
  ImagePlus,
  RotateCcw,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { Course } from "@/contracts/courses";
import {
  type MaterialResponse,
  materialResponseSchema,
  uploadMaterialFieldsSchema,
} from "@/contracts/materials";

import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import { ApiError, errorMessage, fetchApi } from "./fetch-api";
import { formatBytes } from "./material-format";
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

// 画面に出す失敗。title で何が起きたか、detail で次にどうすればよいかを伝える
type Failure = { title: string; detail: string };

// 写真を選ぶ入力欄（label）を、共通のボタンと同じ見た目にする。
// 入力欄は見えなくしているので、キーボードで選んだときは label に枠を出す
const pickClass =
  "inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent";

function imageFailure(e: unknown): Failure {
  if (e instanceof ImageError) {
    const title = {
      format: "この形式の画像は読み込めません",
      size: "画像が大きすぎます",
      other: "画像を準備できませんでした",
    }[e.kind];
    return { title, detail: e.message };
  }
  return {
    title: "画像を準備できませんでした",
    detail: "もう一度、画像を選んでください。",
  };
}

function uploadFailure(e: unknown): Failure {
  // 413 = 送ったデータが大きすぎる（サーバーの上限）
  if (e instanceof ApiError && e.status === 413) {
    return {
      title: "画像が大きすぎます",
      detail: "別の写真を選ぶか、撮り直してください。",
    };
  }
  return { title: "アップロードできませんでした", detail: errorMessage(e) };
}

export function BoardUpload({ courses }: Props) {
  const router = useRouter();
  const [picked, setPicked] = useState<Picked | null>(null);
  // 画像を縮小している間は true
  const [preparing, setPreparing] = useState(false);
  // 科目が 1 つだけなら、最初から選んでおく
  const [courseId, setCourseId] = useState(
    courses.length === 1 ? courses[0].id : "",
  );
  const [uploading, setUploading] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);

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

    setFailure(null);
    setPreparing(true);
    try {
      const resized = await resizeImage(file);
      setPicked({ file: resized, previewUrl: URL.createObjectURL(resized) });
    } catch (e) {
      setFailure(imageFailure(e));
    } finally {
      setPreparing(false);
    }
  }

  function reset() {
    setPicked(null);
    setFailure(null);
  }

  async function handleUpload() {
    if (!picked || uploading) return;
    const fields = uploadMaterialFieldsSchema.safeParse({
      courseId,
      kind: "board",
    });
    if (!fields.success) {
      setFailure({
        title: "科目を選んでください",
        detail: "どの授業の板書かを選ぶと、科目ごとの一覧に入ります。",
      });
      return;
    }

    const body = new FormData();
    body.append("file", picked.file);
    body.append("courseId", fields.data.courseId);
    body.append("kind", fields.data.kind);

    setFailure(null);
    setUploading(true);
    try {
      const { material } = await upload(body);
      router.push(`/materials/${material.id}`);
      // 移るまでの間も「アップロードしています」のままにする
    } catch (e) {
      setFailure(uploadFailure(e));
      setUploading(false);
    }
  }

  if (courses.length === 0) {
    return (
      <section className="border-line bg-surface flex flex-col items-start gap-3 rounded-sm border p-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-base">板書を追加</h2>
          <p className="text-muted text-sm [word-break:auto-phrase]">
            板書は科目ごとに整理します。先に時間割へ科目を登録してください。
          </p>
        </div>
        <Link
          href="/timetable"
          className="border-line bg-background hover:border-foreground inline-flex items-center gap-2 border px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors"
        >
          <CalendarPlus aria-hidden className="size-4" />
          時間割に科目を登録する
        </Link>
      </section>
    );
  }

  return (
    <section className="border-line bg-surface flex flex-col gap-4 rounded-sm border p-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-base">板書を追加</h2>
        <p className="text-muted text-sm [word-break:auto-phrase]">
          撮った写真は、自分だけが見られます。
        </p>
      </div>

      {preparing ? (
        <div role="status" className="flex flex-col gap-2">
          <div className="skeleton h-40 w-full" />
          <p className="text-muted flex items-center justify-center gap-2 text-sm">
            <Spinner />
            画像を準備しています
          </p>
        </div>
      ) : !picked ? (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <label
              className={`${pickClass} bg-foreground text-background hover:bg-foreground/85`}
            >
              <Camera aria-hidden className="size-4" />
              カメラで撮る
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePick}
                className="sr-only"
              />
            </label>
            <label
              className={`${pickClass} border-line bg-background text-foreground hover:border-foreground border`}
            >
              <ImagePlus aria-hidden className="size-4" />
              写真を選ぶ
              <input
                type="file"
                accept="image/*"
                onChange={handlePick}
                className="sr-only"
              />
            </label>
          </div>
          <p className="text-muted text-xs [word-break:auto-phrase]">
            JPEG・PNG・WebP の画像。大きな写真は、送る前に自動で縮小します。
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <figure className="flex flex-col gap-1.5">
            <div className="border-line bg-background relative overflow-hidden rounded-sm border">
              {/* eslint-disable-next-line @next/next/no-img-element -- 選んだ画像はまだ送っていないので、ブラウザの中の URL を直接出す */}
              <img
                src={picked.previewUrl}
                alt="アップロードする板書のプレビュー"
                className={`max-h-[40vh] w-full object-contain transition-opacity ${uploading ? "opacity-60" : ""}`}
              />
              {/* 送っている間は、画像の上端に進行中の線を出す */}
              {uploading && (
                <span
                  aria-hidden
                  className="bg-accent absolute inset-x-0 top-0 h-0.5 origin-left"
                  style={{ animation: "bar 900ms ease-out infinite alternate" }}
                />
              )}
            </div>
            <figcaption className="flex items-center justify-between gap-2">
              <span className="font-display text-muted text-sm tabular-nums">
                {formatBytes(picked.file.size)}
              </span>
              <Button
                type="button"
                variant="ghost"
                onClick={reset}
                disabled={uploading}
                icon={<RotateCcw aria-hidden className="size-4" />}
                className="-mr-2 px-2 whitespace-nowrap"
              >
                選び直す
              </Button>
            </figcaption>
          </figure>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold">どの科目の板書ですか</span>
            <select
              value={courseId}
              onChange={(event) => {
                setCourseId(event.target.value);
                setFailure(null);
              }}
              disabled={uploading}
              className="py-2.5"
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

          <Button
            type="button"
            onClick={handleUpload}
            loading={uploading}
            icon={<Upload aria-hidden className="size-4" />}
            className="w-full whitespace-nowrap"
          >
            {uploading ? "アップロードしています" : "アップロードする"}
          </Button>
        </div>
      )}

      {failure && (
        <div
          role="alert"
          className="bg-danger/10 text-danger flex gap-2 rounded-sm px-3 py-2.5 text-sm"
        >
          <CircleAlert aria-hidden className="mt-1 size-4 shrink-0" />
          <div className="flex flex-col">
            <p className="font-semibold">{failure.title}</p>
            <p className="[word-break:auto-phrase]">{failure.detail}</p>
          </div>
        </div>
      )}
    </section>
  );
}
