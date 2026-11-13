// front 担当のファイル。
// ホームの「短い復習」の欄（#64）。API の reviews（前回の資料のまとめ）を出す。
// まとめは AI が作るので、元の資料を開けるリンク（/materials/[id]）を必ず付ける。
// 資料の詳細の画面は #68 で作る（それまでリンク先は 404）。
// 復習が 1 つも無いときは、欄ごと出さない。
// 見出しの先頭の「提案」のチップは、移動を始める時刻まで出す。
// 過ぎたら（次の授業カードが「急ごう！」に変わったら）、復習より移動が先なのでチップを消す。
"use client";

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
    <section
      aria-labelledby="review-title"
      className="flex flex-col gap-3 rounded-lg border border-current/20 px-5 py-4"
    >
      <h2
        id="review-title"
        className="flex items-center gap-2 text-sm font-semibold"
      >
        {showChip && <SuggestionChip />}
        <span className="opacity-70">短い復習</span>
      </h2>
      <ul className="flex flex-col gap-4">
        {reviews.map((review) => (
          <li key={review.materialId} className="flex flex-col gap-1">
            <p className="text-sm opacity-70">{review.courseName}</p>
            <p className="text-base leading-snug">{review.summary}</p>
            <Link
              href={`/materials/${review.materialId}`}
              className="text-sm font-semibold underline"
            >
              資料を開く →
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
