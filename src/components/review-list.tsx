// front 担当のファイル。
// ホームの「短い復習」（#64）。API の reviews（前回の資料のまとめ）を出す。
// ホームでは、1 つ目のまとめを短く（2 行まで）出し、押すとモーダルで全部のまとめを出す（1 画面に収めるため）。
// まとめは AI が作るので、モーダルの各まとめに、元の資料を開くリンク（/materials/[id]）を必ず付ける。
// 復習が 1 つも無いときは、行ごと出さない。
"use client";

import { BookOpenCheck, FileText } from "lucide-react";
import { useState } from "react";

import type { ReviewItem } from "@/contracts/home";

import { SuggestionRow } from "./suggestion-row";
import { ButtonLink } from "./ui/button-link";
import { Modal } from "./ui/modal";

export function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  const [open, setOpen] = useState(false);
  if (reviews.length === 0) return null;

  const first = reviews[0];
  return (
    <div>
      <SuggestionRow
        icon={<BookOpenCheck aria-hidden />}
        label="短い復習"
        meta={reviews.length > 1 ? `${reviews.length} 件` : undefined}
        summary={
          <>
            <span className="font-semibold">{first.courseName}</span>
            <span className="text-muted"> ― </span>
            {first.summary}
          </>
        }
        onOpen={() => setOpen(true)}
      />
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="短い復習（前回のまとめ）"
      >
        <ul className="divide-line -my-4 divide-y">
          {reviews.map((review) => (
            <li key={review.materialId} className="flex flex-col gap-2 py-4">
              <h3 className="text-muted text-sm [word-break:auto-phrase]">
                {review.courseName}
              </h3>
              <p className="leading-relaxed [word-break:auto-phrase]">
                {review.summary}
              </p>
              <ButtonLink
                href={`/materials/${review.materialId}`}
                variant="ghost"
                icon={<FileText aria-hidden className="size-4" />}
                className="-ml-4 self-start"
              >
                元の資料を開く
              </ButtonLink>
            </li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}
