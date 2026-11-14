// front 担当のファイル。
// AI が作った板書の解説（要約、用語、数式、省略された説明、読めなかった箇所）を表示する（#68）。
// 解説の形は src/lib/ai/explanation-schema.ts（contracts の materials.ts からも使われている）。
// - 全部を縦に並べず、タブで「今読むもの」だけを出す。最初は要約。項目が無いタブは出さない
// - 中身は、画面の中の決まった場所（ScrollArea）だけでスクロールする
// - 最後に「AI は間違うことがある」と、元の画像を開くボタンを置く
// 数式は LaTeX（数式の書き方）の文字のまま出す。きれいな数式で出すにはライブラリが要るので、別に相談する。
"use client";

import { useId, useState } from "react";

import type { MaterialDetailResponse } from "@/contracts/materials";

import { ScrollArea } from "./ui/screen";
import { keepNumbersTogether } from "./material-format";

// 画面は contracts だけを見る決まりなので、解説の型は contracts の詳細の型から取り出す
export type Explanation = NonNullable<MaterialDetailResponse["explanation"]>;

type TabId = "summary" | "terms" | "formulas" | "omissions" | "unreadable";

export function ExplanationView({
  explanation,
  onOpenImage,
}: {
  explanation: Explanation;
  onOpenImage: () => void;
}) {
  const { summary, terms, formulas, omissions, unreadable } = explanation;
  const [tab, setTab] = useState<TabId>("summary");
  const baseId = useId();

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "summary", label: "要約" },
    { id: "terms", label: "用語", count: terms.length },
    { id: "formulas", label: "数式", count: formulas.length },
    { id: "omissions", label: "補足", count: omissions.length },
    { id: "unreadable", label: "読めない所", count: unreadable.length },
  ];
  const shown = tabs.filter((t) => t.count === undefined || t.count > 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        role="tablist"
        aria-label="解説"
        className="border-line flex shrink-0 [scrollbar-width:none] overflow-x-auto border-b"
      >
        {shown.map((t) => {
          const selected = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`${baseId}-${t.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              onClick={() => setTab(t.id)}
              className={`relative inline-flex h-11 shrink-0 items-center gap-1.5 rounded-none px-3 text-sm whitespace-nowrap transition-colors first:pl-0.5 ${
                selected
                  ? "text-foreground font-semibold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className="font-display text-muted font-normal tabular-nums">
                  {t.count}
                </span>
              )}
              <span
                aria-hidden
                className={`bg-accent absolute inset-x-0 -bottom-px h-0.5 transition-opacity ${selected ? "opacity-100" : "opacity-0"}`}
              />
            </button>
          );
        })}
      </div>

      <ScrollArea>
        <div
          role="tabpanel"
          id={`${baseId}-panel`}
          aria-labelledby={`${baseId}-${tab}`}
          className="flex flex-col gap-5 py-4"
        >
          {tab === "summary" && (
            <p className="text-[1.0625rem] leading-[1.9] [word-break:auto-phrase]">
              {keepNumbersTogether(summary)}
            </p>
          )}

          {tab === "terms" && (
            <dl className="divide-line flex flex-col divide-y">
              {terms.map((t, i) => (
                <div key={i} className="flex flex-col gap-1 py-3 first:pt-0">
                  <dt className="font-semibold [word-break:auto-phrase]">
                    {keepNumbersTogether(t.term)}
                  </dt>
                  <dd className="text-sm leading-relaxed [word-break:auto-phrase]">
                    {keepNumbersTogether(t.meaning)}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {tab === "formulas" && (
            <ul className="flex flex-col gap-5">
              {formulas.map((f, i) => (
                <li key={i} className="flex flex-col gap-2">
                  {/* 長い数式は横にスクロールして見る。数式は 1 文字ずつ読むので、幅のそろった書体にする */}
                  <code className="border-line bg-surface overflow-x-auto rounded-sm border px-3 py-2 font-mono text-sm whitespace-pre">
                    {f.formula}
                  </code>
                  <p className="text-sm leading-relaxed [word-break:auto-phrase]">
                    {keepNumbersTogether(f.explanation)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {tab === "omissions" && (
            <dl className="divide-line flex flex-col divide-y">
              {omissions.map((o, i) => (
                <div key={i} className="flex flex-col gap-1 py-3 first:pt-0">
                  <dt className="font-semibold [word-break:auto-phrase]">
                    {keepNumbersTogether(o.topic)}
                  </dt>
                  <dd className="text-sm leading-relaxed [word-break:auto-phrase]">
                    {keepNumbersTogether(o.explanation)}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {tab === "unreadable" && (
            <ul className="flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed">
              {unreadable.map((u, i) => (
                <li key={i} className="[word-break:auto-phrase]">
                  {keepNumbersTogether(u)}
                </li>
              ))}
            </ul>
          )}

          <p className="text-muted border-line flex flex-wrap items-center gap-x-1 border-t pt-3 text-xs">
            <span className="[word-break:auto-phrase]">
              AI の解説は間違うことがあります。
            </span>
            <button
              type="button"
              onClick={onOpenImage}
              className="text-foreground inline-flex items-center font-semibold whitespace-nowrap underline underline-offset-4"
            >
              元の画像で確かめる
            </button>
          </p>
        </div>
      </ScrollArea>
    </div>
  );
}
