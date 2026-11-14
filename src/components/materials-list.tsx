// front 担当のファイル。
// 資料一覧（#67）。新しい順に 1 列に並べ、上の切り替えで科目を絞り込む。
// - 絞り込みは、資料がある科目だけを横に並べる（押しやすく、今どれを見ているかが一目で分かる）。科目が 1 つなら出さない
// - 一覧は、画面の中の決まった場所（ScrollArea）だけでスクロールする
// - 1 件を押すと、資料の詳細（/materials/[id]）へ移動する
// - 資料が 1 件も無いときは、空であることと、最初の 1 枚を撮る操作（emptyAction）を真ん中に出す
"use client";

import { CalendarPlus, ChevronRight, Images, Sparkles } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";

import type { Course } from "@/contracts/courses";
import type { Material } from "@/contracts/materials";

import { ButtonLink } from "./ui/button-link";
import { ScrollArea } from "./ui/screen";
import { formatCreatedAt, MATERIAL_KIND_LABELS } from "./material-format";

type Props = {
  materials: Material[];
  // 科目名を出すためと、絞り込みの選択肢のための、時間割の科目
  courses: Course[];
  // 資料が無いときに出す操作（撮る・選ぶ）。科目が無くて追加できないときは null
  emptyAction: ReactNode;
};

// 絞り込みで「すべて」を選んでいるときの値
const ALL = "all";
// 時間割から消えた科目の資料を見失わないよう、まとめて 1 つの科目として扱う
const UNKNOWN = "unknown";
const UNKNOWN_COURSE_NAME = "時間割に無い科目";

export function MaterialsList({ materials, courses, emptyAction }: Props) {
  const [filter, setFilter] = useState<string>(ALL);

  if (materials.length === 0) {
    return <EmptyMaterials action={emptyAction} />;
  }

  const names = new Map(courses.map((c) => [c.id, c.name]));
  const groupOf = (m: Material) =>
    names.has(m.courseId) ? m.courseId : UNKNOWN;

  // 新しい順
  const sorted = [...materials].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // 絞り込みの選択肢：資料がある科目だけ、時間割の順に。時間割に無い科目は最後
  const counts = new Map<string, number>();
  for (const m of sorted) {
    counts.set(groupOf(m), (counts.get(groupOf(m)) ?? 0) + 1);
  }
  const options = [
    ...courses
      .filter((c) => counts.has(c.id))
      .map((c) => ({ id: c.id, name: c.name })),
    ...(counts.has(UNKNOWN)
      ? [{ id: UNKNOWN, name: UNKNOWN_COURSE_NAME }]
      : []),
  ];

  // 選んでいた科目の資料が無くなったときは「すべて」に戻す
  const current = filter !== ALL && counts.has(filter) ? filter : ALL;
  const shown =
    current === ALL ? sorted : sorted.filter((m) => groupOf(m) === current);

  return (
    <>
      {options.length > 1 && (
        <div
          role="radiogroup"
          aria-label="科目で絞り込む"
          className="-mx-4 flex shrink-0 [scrollbar-width:none] gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6"
        >
          <FilterChip
            label="すべて"
            count={materials.length}
            active={current === ALL}
            onClick={() => setFilter(ALL)}
          />
          {options.map((o) => (
            <FilterChip
              key={o.id}
              label={o.name}
              count={counts.get(o.id) ?? 0}
              active={current === o.id}
              onClick={() => setFilter(o.id)}
            />
          ))}
        </div>
      )}

      <ScrollArea className="border-line -mx-4 border-t px-4 sm:-mx-6 sm:px-6">
        <ul aria-label="資料" className="divide-line flex flex-col divide-y">
          {shown.map((material) => (
            <li key={material.id}>
              <MaterialRow
                material={material}
                courseName={names.get(material.courseId) ?? UNKNOWN_COURSE_NAME}
              />
            </li>
          ))}
        </ul>
      </ScrollArea>
    </>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-sm border px-3.5 text-sm whitespace-nowrap transition-colors ${
        active
          ? "border-foreground bg-foreground text-background font-semibold"
          : "border-line bg-surface text-foreground hover:border-foreground"
      }`}
    >
      {label}
      <span
        className={`font-display tabular-nums ${active ? "text-background/70" : "text-muted"}`}
      >
        {count}
      </span>
    </button>
  );
}

function MaterialRow({
  material,
  courseName,
}: {
  material: Material;
  courseName: string;
}) {
  return (
    <Link
      href={`/materials/${material.id}`}
      className="group hover:bg-surface -mx-2 flex items-center gap-3 px-2 py-3 transition-colors"
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-semibold">{courseName}</span>
        <span className="text-muted flex items-center gap-2 text-sm">
          <span className="font-display tabular-nums">
            {formatCreatedAt(material.createdAt)}
          </span>
          <span className="whitespace-nowrap">
            {MATERIAL_KIND_LABELS[material.kind]}
          </span>
        </span>
      </span>
      {material.hasExplanation ? (
        <span className="bg-accent-soft text-accent inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-semibold whitespace-nowrap">
          <Sparkles aria-hidden className="size-3.5" />
          解説あり
        </span>
      ) : (
        <span className="text-muted text-xs whitespace-nowrap">解説なし</span>
      )}
      <ChevronRight
        aria-hidden
        className="text-muted group-hover:text-foreground size-4 shrink-0 transition-colors"
      />
    </Link>
  );
}

// 資料が 1 件も無いとき。科目が無ければ、先に時間割へ案内する
function EmptyMaterials({ action }: { action: ReactNode }) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-5 pb-10 text-center">
      {action ? (
        <Images aria-hidden className="text-muted size-9" strokeWidth={1.5} />
      ) : (
        <CalendarPlus
          aria-hidden
          className="text-muted size-9"
          strokeWidth={1.5}
        />
      )}
      <div className="flex flex-col gap-1">
        <h2 className="text-base">資料はまだありません</h2>
        <p className="text-muted text-sm [word-break:auto-phrase]">
          {action
            ? "授業の板書を撮って、最初の 1 枚を追加しましょう"
            : "時間割に科目を登録すると、板書を追加できます"}
        </p>
      </div>
      {action ?? (
        <ButtonLink
          href="/timetable"
          icon={<CalendarPlus aria-hidden className="size-4" />}
        >
          時間割を開く
        </ButtonLink>
      )}
    </section>
  );
}
