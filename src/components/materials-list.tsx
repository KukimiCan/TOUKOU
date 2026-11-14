// front 担当のファイル。
// 資料一覧（#67）。科目ごとに資料を新しい順に並べ、上のプルダウンで科目を絞り込める。
// - 「すべての科目」のときは、科目ごとに見出しを付けて並べる（時間割の科目の順）
// - 1 件を押すと、資料の詳細（/materials/[id]）へ移動する
// - 資料が 1 件も無いときは、絞り込みを出さずに、最初の 1 枚を追加する案内を出す
// - 科目が 1 つだけのときは、絞り込む意味が無いのでプルダウンを出さない
"use client";

import { ChevronRight, Images, ScanText, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import type { Course } from "@/contracts/courses";
import type { Material } from "@/contracts/materials";

import { formatCreatedAt, MATERIAL_KIND_LABELS } from "./material-format";

type Props = {
  materials: Material[];
  // 科目名を出すためと、絞り込みの選択肢のための、時間割の科目
  courses: Course[];
};

// 絞り込みで「すべての科目」を選んでいるときの値
const ALL = "all";

// 時間割から消えた科目の資料を見失わないよう、見つからない科目にも見出しを付ける
const UNKNOWN_COURSE_NAME = "（時間割に無い科目）";

export function MaterialsList({ materials, courses }: Props) {
  const [courseId, setCourseId] = useState<string>(ALL);

  if (materials.length === 0) {
    return <EmptyMaterials canUpload={courses.length > 0} />;
  }

  // 新しい順に並べてから、科目ごとに分ける
  const sorted = [...materials].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const knownIds = new Set(courses.map((c) => c.id));
  const groups = [
    ...courses.map((course) => ({
      id: course.id,
      name: course.name,
      materials: sorted.filter((m) => m.courseId === course.id),
    })),
    {
      id: "unknown",
      name: UNKNOWN_COURSE_NAME,
      materials: sorted.filter((m) => !knownIds.has(m.courseId)),
    },
  ];

  const shown =
    courseId === ALL
      ? // すべてのときは、資料が 1 件も無い科目は出さない
        groups.filter((g) => g.materials.length > 0)
      : groups.filter((g) => g.id === courseId);

  return (
    <section
      aria-labelledby="materials-heading"
      className="flex flex-col gap-6"
    >
      <h2 id="materials-heading" className="text-lg">
        これまでの資料
        <span className="font-display text-muted ml-2 text-sm font-normal tabular-nums">
          {materials.length} 件
        </span>
      </h2>

      {courses.length > 1 && (
        <label className="flex flex-col gap-1">
          <span className="text-muted text-sm">科目で絞り込む</span>
          <select
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            className="py-2.5"
          >
            <option value={ALL}>すべての科目</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {shown.map((group) => (
        <section key={group.id} className="flex flex-col gap-1">
          <h3 className="flex items-baseline gap-2 text-sm">
            <span className="min-w-0 [word-break:auto-phrase]">
              {group.name}
            </span>
            <span className="font-display text-muted font-normal whitespace-nowrap tabular-nums">
              {group.materials.length} 件
            </span>
          </h3>
          {group.materials.length === 0 ? (
            <p className="border-line text-muted border-t py-4 text-sm">
              この科目の資料はまだありません。
            </p>
          ) : (
            <ul className="divide-line border-line flex flex-col divide-y border-y">
              {group.materials.map((material) => (
                <li key={material.id}>
                  <MaterialRow material={material} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </section>
  );
}

function MaterialRow({ material }: { material: Material }) {
  return (
    <Link
      href={`/materials/${material.id}`}
      className="group hover:bg-surface -mx-2 flex items-center gap-3 px-2 py-3 transition-colors"
    >
      <span className="border-line bg-surface text-muted grid size-9 shrink-0 place-items-center rounded-sm border">
        <ScanText aria-hidden className="size-4" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-semibold">
          {MATERIAL_KIND_LABELS[material.kind]}
        </span>
        <span className="font-display text-muted text-sm tabular-nums">
          {formatCreatedAt(material.createdAt)}
        </span>
      </span>
      {material.hasExplanation ? (
        <span className="bg-accent-soft text-accent inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-semibold whitespace-nowrap">
          <Sparkles aria-hidden className="size-3.5" />
          解説あり
        </span>
      ) : (
        <span className="text-muted text-xs whitespace-nowrap">解説はまだ</span>
      )}
      <ChevronRight
        aria-hidden
        className="text-muted group-hover:text-foreground size-4 shrink-0 transition-colors"
      />
    </Link>
  );
}

// 資料が 1 件も無いとき。追加の操作（カメラで撮る／写真を選ぶ）はすぐ上にあるので、ここではボタンを重ねずに案内だけ出す。
// 科目が無いときは、上の追加欄が時間割へ案内している
function EmptyMaterials({ canUpload }: { canUpload: boolean }) {
  return (
    <section className="border-line flex flex-col items-center gap-3 border-t py-10 text-center">
      <Images aria-hidden className="text-muted size-8" strokeWidth={1.5} />
      <div className="flex flex-col gap-1">
        <h2 className="text-base">資料はまだありません</h2>
        <p className="text-muted text-sm [word-break:auto-phrase]">
          {canUpload
            ? "上の「カメラで撮る」から、授業の板書を 1 枚追加してみましょう。"
            : "時間割に科目を登録すると、板書を追加できます。"}
        </p>
      </div>
    </section>
  );
}
