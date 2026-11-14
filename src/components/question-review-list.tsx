// front 担当のファイル。
// 問題の確認・公開（#70）。画面は端末の高さに収め、一覧だけを ScrollArea の中でスクロールさせる。
// - 一覧は「番号・問題文の 2 行・公開の印」だけ。押すと Modal で選択肢・正解・解説・元の資料へのリンクを出す
// - 公開は Modal の下の「公開して URL をコピー」1 回で済む。何が公開されるかは、ボタンのすぐ上に 1 行で書く
//   公開できたら、その場で共有 URL をコピーする（コピーできなかったときは「URL をコピー」のボタンを出す）
// - 公開中の問題は、一覧の行のコピーのボタンで、詳細を開かずに URL を送り直せる（#71）
// - 公開は API（POST /api/questions/[id]/publish）を呼ぶ（#156）。失敗したら理由を出し、もう一度押せるようにする
"use client";

import { Check, FileText, Globe, ListChecks, Lock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  type Question,
  publishQuestionResponseSchema,
} from "@/contracts/questions";

import { ChoiceMark } from "./answer-result";
import {
  CopyShareIconButton,
  CopyShareUrl,
  copyShareUrl,
} from "./copy-share-url";
import { errorMessage, fetchApi } from "./fetch-api";
import { CHOICE_LABELS, questionNumber } from "./question-format";
import { Button } from "./ui/button";
import { ButtonLink } from "./ui/button-link";
import { Modal } from "./ui/modal";
import { Screen, ScrollArea } from "./ui/screen";

type Props = {
  questions: Question[];
};

// 問題を公開して、共有 URL に使う ID（shareId）を受け取る。何度押しても同じ ID が返る
async function publish(id: string): Promise<{ shareId: string }> {
  const res = await fetchApi(
    `/api/questions/${encodeURIComponent(id)}/publish`,
    { method: "POST" },
  );
  return publishQuestionResponseSchema.parse(await res.json());
}

export function QuestionReviewList({ questions: initial }: Props) {
  const [questions, setQuestions] = useState(initial);
  // Modal で開いている問題。閉じる動きの間も中身を残すため、開いているかは別に持つ
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function show(id: string) {
    setSelectedId(id);
    setOpen(true);
  }

  function handlePublished(id: string, shareId: string) {
    setQuestions((qs) =>
      qs.map((q) => (q.id === id ? { ...q, isPublic: true, shareId } : q)),
    );
  }

  const publicCount = questions.filter((q) => q.isPublic).length;
  const selectedIndex = questions.findIndex((q) => q.id === selectedId);
  const selected = selectedIndex >= 0 ? questions[selectedIndex] : null;

  return (
    <Screen
      label="Questions"
      title="問題"
      actions={
        questions.length > 0 && (
          <p className="text-muted text-sm whitespace-nowrap">
            公開
            <span className="font-display text-foreground mx-1 text-lg font-semibold tabular-nums">
              {publicCount}
            </span>
            /
            <span className="font-display mx-1 text-lg tabular-nums">
              {questions.length}
            </span>
            問
          </p>
        )
      }
    >
      {questions.length === 0 ? (
        <EmptyQuestions />
      ) : (
        <ScrollArea className="border-line -mx-1 border-t px-1">
          <ul aria-label="問題の一覧">
            {questions.map((question, index) => (
              <QuestionRow
                key={question.id}
                question={question}
                number={index + 1}
                onOpen={() => show(question.id)}
              />
            ))}
          </ul>
        </ScrollArea>
      )}

      {selected && (
        <QuestionDetail
          // 問題を切り替えたら、公開の途中の状態を持ち越さない
          key={selected.id}
          open={open}
          onClose={() => setOpen(false)}
          question={selected}
          number={selectedIndex + 1}
          onPublished={(shareId) => handlePublished(selected.id, shareId)}
        />
      )}
    </Screen>
  );
}

// 問題が 1 つも無いとき。問題は資料の画面で作るので、そこへの導線を出す
function EmptyQuestions() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 pb-8 text-center">
      <span className="bg-accent-soft text-accent flex size-12 items-center justify-center rounded-full">
        <ListChecks aria-hidden className="size-6" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-semibold">問題はまだありません</p>
        <p className="text-muted text-sm [word-break:auto-phrase]">
          資料の画面で、解説と一緒に作れます。
        </p>
      </div>
      <ButtonLink
        href="/materials"
        icon={<FileText aria-hidden className="size-4" />}
      >
        資料を開く
      </ButtonLink>
    </div>
  );
}

function QuestionRow({
  question,
  number,
  onOpen,
}: {
  question: Question;
  number: number;
  onOpen: () => void;
}) {
  const label = `Q${questionNumber(number)}`;
  return (
    <li className="border-line relative flex items-center gap-1 border-b">
      <button
        type="button"
        data-shot="question"
        onClick={onOpen}
        className="hover:bg-surface flex min-w-0 flex-1 items-start gap-3 py-3.5 pr-1 pl-1 text-left"
      >
        <span className="font-display text-muted w-7 shrink-0 pt-px text-sm font-semibold tracking-wider tabular-nums">
          <span className="sr-only">問題 {number}</span>
          <span aria-hidden>{label}</span>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="line-clamp-2 text-[0.9375rem] leading-relaxed [word-break:auto-phrase]">
            {question.prompt}
          </span>
          <StatusMark isPublic={question.isPublic} />
        </span>
      </button>
      {question.isPublic && question.shareId ? (
        <CopyShareIconButton
          shareId={question.shareId}
          label={`${label} の共有 URL をコピー`}
          onFailed={onOpen}
        />
      ) : (
        // 行の右端をそろえる（コピーのボタンと同じ幅）
        <span aria-hidden className="w-11 shrink-0" />
      )}
    </li>
  );
}

function StatusMark({ isPublic }: { isPublic: boolean }) {
  return isPublic ? (
    <span className="text-success inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap">
      <Globe aria-hidden className="size-3.5" />
      公開中
    </span>
  ) : (
    <span className="text-muted inline-flex items-center gap-1 text-xs whitespace-nowrap">
      <Lock aria-hidden className="size-3.5" />
      未公開
    </span>
  );
}

function QuestionDetail({
  open,
  onClose,
  question,
  number,
  onPublished,
}: {
  open: boolean;
  onClose: () => void;
  question: Question;
  number: number;
  onPublished: (shareId: string) => void;
}) {
  const [publishing, setPublishing] = useState(false);
  // この Modal で公開したところか。copied は、公開と同時に URL をコピーできたか
  const [published, setPublished] = useState<{ copied: boolean } | null>(null);
  // 公開に失敗したときに出す文（失敗していなければ null）
  const [error, setError] = useState<string | null>(null);

  async function handlePublish() {
    if (publishing) return;
    setPublishing(true);
    setError(null);
    try {
      const { shareId } = await publish(question.id);
      onPublished(shareId);
      setPublished({ copied: await copyShareUrl(shareId) });
    } catch (e) {
      setError(`公開できませんでした。${errorMessage(e)}`);
    } finally {
      setPublishing(false);
    }
  }

  const footer =
    question.isPublic && question.shareId ? (
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {published && (
          <p
            role="status"
            className="text-success flex items-center gap-1.5 text-sm font-semibold transition-opacity duration-200 starting:opacity-0"
          >
            <Check aria-hidden className="size-4 shrink-0" />
            {published.copied
              ? "公開して、URL をコピーしました"
              : "公開しました"}
          </p>
        )}
        <CopyShareUrl
          shareId={question.shareId}
          copied={published?.copied ?? false}
        />
      </div>
    ) : (
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {error ? (
          <p
            role="alert"
            className="text-danger text-sm [word-break:auto-phrase]"
          >
            {error}
          </p>
        ) : (
          <p className="text-muted text-xs [word-break:auto-phrase]">
            URL を知っている人に、問題と解説だけが公開されます。
          </p>
        )}
        <Button
          data-shot="publish"
          onClick={handlePublish}
          loading={publishing}
          icon={<Globe aria-hidden className="size-4" />}
          className="w-full"
        >
          {publishing ? "公開しています" : "公開して URL をコピー"}
        </Button>
      </div>
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Q${questionNumber(number)}`}
      footer={footer}
    >
      <div className="flex flex-col gap-3.5">
        <p className="leading-relaxed font-medium [word-break:auto-phrase]">
          {question.prompt}
        </p>

        <ol className="flex flex-col gap-1" aria-label="選択肢">
          {question.choices.map((choice, i) => {
            const isAnswer = i === question.answerIndex;
            return (
              <li
                key={i}
                className={`flex items-center gap-3 rounded-sm border px-3 py-1.5 text-sm ${
                  isAnswer
                    ? "border-success/40 bg-success/10"
                    : "border-line bg-surface"
                }`}
              >
                <ChoiceMark
                  label={CHOICE_LABELS[i]}
                  tone={isAnswer ? "correct" : "plain"}
                />
                <span className="sr-only">{CHOICE_LABELS[i]}.</span>
                <span className="flex-1 leading-relaxed [word-break:auto-phrase]">
                  {choice}
                </span>
                {isAnswer && (
                  <span className="text-success inline-flex shrink-0 items-center gap-1 text-xs font-semibold whitespace-nowrap">
                    <Check aria-hidden className="size-3.5" />
                    正解
                  </span>
                )}
              </li>
            );
          })}
        </ol>

        <section className="border-accent/50 flex flex-col gap-1 border-l-2 pl-3">
          <h3 className="text-muted text-xs font-semibold">解説</h3>
          <p className="text-sm leading-relaxed [word-break:auto-phrase]">
            {question.explanation}
          </p>
        </section>

        <p className="text-muted flex flex-wrap items-center gap-x-3 text-xs [word-break:auto-phrase]">
          AI が作った問題は、間違うことがあります。
          <Link
            href={`/materials/${question.materialId}`}
            className="text-accent inline-flex items-center gap-1 font-semibold whitespace-nowrap underline-offset-4 hover:underline"
          >
            <FileText aria-hidden className="size-3.5" />
            元の資料と見比べる
          </Link>
        </p>
      </div>
    </Modal>
  );
}
