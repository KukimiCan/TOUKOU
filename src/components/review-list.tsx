// front 担当のファイル。
// ホームの「短い復習」の欄（#64）。API の reviews（前回の資料のまとめ）を出す。
// まとめは AI が作るので、元の資料を開けるリンク（/materials/[id]）を必ず付ける。
// 復習が 1 つも無いときは、欄ごと出さない。
// 見出しの先頭の「提案」のチップは、移動を始める時刻まで出す。
// 過ぎたら（次の授業カードが「急ごう！」に変わったら）、復習より移動が先なのでチップを消す。
// カードで囲まず、見出しと罫線で区切る。
"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { ReviewItem } from "@/contracts/home";

import { SuggestionChip } from "./suggestion-chip";
import { useClassClock } from "./use-class-clock";

type Props = {
  reviews: ReviewItem[];
  // 次の授業の移動を始める時刻（次の授業が無いときは無し）
  leaveAt?: string;
};

export function ReviewList({ reviews, leaveAt }: Props) {
  const now = useClassClock();
  if (reviews.length === 0) return null;

  // 時計が動き出すまで（画面に出る前）は、チップを出さない（出してすぐ消えるのを防ぐ）
  const showChip =
    leaveAt !== undefined && now !== null && now < new Date(leaveAt).getTime();

  return (
    <section aria-labelledby="review-title" className="flex flex-col">
      <h2
        id="review-title"
        className="border-line flex items-center gap-2 border-b pb-2.5 text-base"
      >
        {showChip && <SuggestionChip />}
        短い復習
        <span className="text-muted text-sm font-normal">前回のまとめ</span>
      </h2>
      <ul className="divide-line divide-y">
        {reviews.map((review) => (
          <li key={review.materialId} className="flex flex-col gap-1 py-4">
            <p className="text-muted text-sm font-semibold [word-break:auto-phrase]">
              {review.courseName}
            </p>
            <p className="leading-relaxed [word-break:auto-phrase]">
              {review.summary}
            </p>
            {/* スマホでは押せる高さ（44px）を確保されるので、文字を上下の中央にそろえる */}
            <Link
              href={`/materials/${review.materialId}`}
              className="group text-accent hover:text-foreground inline-flex items-center gap-1 self-start text-sm font-semibold whitespace-nowrap transition-colors"
            >
              元の資料を開く
              <ArrowRight
                aria-hidden
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
