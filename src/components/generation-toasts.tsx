// front 担当のファイル。
// 解説の生成が終わったときの知らせ。画面の上（ナビの下）に出し、6 秒で自動で消える（× で閉じられる）。
// - 成功：「解説ができました：<科目名>」と「開く」（資料の詳細へ）
// - 失敗：「解説を作れませんでした」と「もう一度」（同じ生成をもう一度作る）
// 読み上げのため、知らせの 1 件ずつに role="status" を付ける。
// 知らせは内容の上に重ねて出し、画面の高さや並びを押し下げない。
"use client";

import { CircleAlert, RefreshCw, Sparkles, X } from "lucide-react";

import { Button } from "./ui/button";
import { ButtonLink } from "./ui/button-link";
import { useGeneration } from "./generation-provider";

export function GenerationToasts() {
  const { notices, dismissNotice, startGeneration } = useGeneration();
  if (notices.length === 0) return null;

  return (
    <div className="relative z-10 h-0 shrink-0">
      <div className="absolute inset-x-0 top-0 mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 pt-2 sm:px-6">
        {notices.map((notice) => (
          <div
            key={notice.id}
            role="status"
            className="border-line bg-surface flex items-center gap-3 rounded-sm border px-3 py-2 text-sm"
          >
            {notice.kind === "success" ? (
              <>
                <Sparkles aria-hidden className="text-accent size-4 shrink-0" />
                <p className="min-w-0 flex-1 font-semibold [word-break:auto-phrase]">
                  解説ができました：{notice.courseName}
                </p>
                <ButtonLink
                  href={`/materials/${notice.materialId}`}
                  variant="secondary"
                  className="px-3"
                  onClick={() => dismissNotice(notice.id)}
                >
                  開く
                </ButtonLink>
              </>
            ) : (
              <>
                <CircleAlert
                  aria-hidden
                  className="text-danger size-4 shrink-0"
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="text-danger font-semibold">
                    解説を作れませんでした
                  </p>
                  <p className="text-muted text-xs [word-break:auto-phrase]">
                    {notice.message}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  className="px-3"
                  icon={<RefreshCw aria-hidden className="size-4" />}
                  onClick={() => {
                    dismissNotice(notice.id);
                    startGeneration(notice.materialId, notice.courseName);
                  }}
                >
                  もう一度
                </Button>
              </>
            )}
            <button
              type="button"
              aria-label="閉じる"
              onClick={() => dismissNotice(notice.id)}
              className="text-muted hover:text-foreground grid size-9 shrink-0 place-items-center transition-colors"
            >
              <X aria-hidden className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
