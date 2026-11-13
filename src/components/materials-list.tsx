// front 担当のファイル。
// 資料一覧（#67）。科目ごとに資料を新しい順に並べ、上のプルダウンで科目を絞り込める。
// - 「すべての科目」のときは、科目ごとに見出しを付けて並べる（時間割の科目の順）
// - 1 件を押すと、資料の詳細（/materials/[id]）へ移動する
"use client";

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
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold">科目</span>
        <select
          value={courseId}
          onChange={(event) => setCourseId(event.target.value)}
          className="rounded border border-current/30 bg-transparent px-3 py-3"
        >
          <option value={ALL}>すべての科目</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </label>

      {shown.length === 0 && (
        <p className="py-8 text-center text-sm opacity-70">
          資料はまだありません。
        </p>
      )}

      {shown.map((group) => (
        <section key={group.id} className="flex flex-col gap-2">
          <h2 className="font-semibold">
            {group.name}
            <span className="ml-2 text-sm font-normal opacity-70">
              {group.materials.length} 件
            </span>
          </h2>
          {group.materials.length === 0 ? (
            <p className="py-4 text-sm opacity-70">
              この科目の資料はまだありません。
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-current/15 border-y border-current/15">
              {group.materials.map((material) => (
                <li key={material.id}>
                  <MaterialRow material={material} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

function MaterialRow({ material }: { material: Material }) {
  return (
    <Link
      href={`/materials/${material.id}`}
      className="flex items-center gap-3 py-3 hover:bg-current/5"
    >
      <span className="flex flex-1 flex-col">
        <span>{MATERIAL_KIND_LABELS[material.kind]}</span>
        <span className="text-sm opacity-70">
          {formatCreatedAt(material.createdAt)}
        </span>
      </span>
      {material.hasExplanation ? (
        <span className="rounded-full border border-current/30 px-2 py-0.5 text-xs">
          解説あり
        </span>
      ) : (
        <span className="text-xs opacity-60">解説はまだ</span>
      )}
      {/* 右向きの矢印（移動できることの印） */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-4 opacity-50"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m9 6 6 6-6 6" />
      </svg>
    </Link>
  );
}
