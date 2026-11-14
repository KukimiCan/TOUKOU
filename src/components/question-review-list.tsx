// front 担当のファイル。
// 問題の確認・公開（#70）。AI が作った問題を 1 問ずつ、罫線で区切って並べる。
// - 問題文、選択肢（正解に印）、解説、元の資料へのリンクを出し、公開前に中身を確かめられる
// - 「公開中」「未公開」を、文字とアイコンの印で見分けられる
// - 「確認して公開する」を押すと、何が公開されて何が公開されないかを説明する確認を挟んでから公開する
// - 公開済みの問題には、共有 URL をコピーするボタンを出す（#71）。公開した直後は、そのボタンに移る
// - 公開は API（POST /api/questions/[id]/publish）を呼ぶ（#156）。失敗したら理由を出し、もう一度押せるようにする
"use client";

import {
  Check,
  CircleCheck,
  FileText,
  Globe,
  ListChecks,
  Lock,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  type Question,
  publishQuestionResponseSchema,
} from "@/contracts/questions";

import { ChoiceMark } from "./answer-result";
import { CopyShareUrl } from "./copy-share-url";
import { errorMessage, fetchApi } from "./fetch-api";
import { CHOICE_LABELS, questionNumber } from "./question-format";
import { Button } from "./ui/button";

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

  function handlePublished(id: string, shareId: string) {
    setQuestions((qs) =>
      qs.map((q) => (q.id === id ? { ...q, isPublic: true, shareId } : q)),
    );
  }

  if (questions.length === 0) {
    return <EmptyQuestions />;
  }

  const publicCount = questions.filter((q) => q.isPublic).length;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted flex items-baseline gap-5 text-sm">
        <span className="whitespace-nowrap">
          全
          <span className="font-display text-foreground mx-1 text-xl font-semibold tabular-nums">
            {questions.length}
          </span>
          問
        </span>
        <span className="whitespace-nowrap">
          公開中
          <span className="font-display text-foreground mx-1 text-xl font-semibold tabular-nums">
            {publicCount}
          </span>
          問
        </span>
      </p>
      <ul className="flex flex-col">
        {questions.map((question, index) => (
          <li key={question.id} className="border-line border-t py-6">
            <QuestionItem
              question={question}
              number={index + 1}
              onPublished={(shareId) => handlePublished(question.id, shareId)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

// 問題が 1 つも無いとき。問題は資料の画面で作るので、そこへの導線を出す
function EmptyQuestions() {
  return (
    <div className="border-line flex flex-col items-center gap-4 border-y px-4 py-12 text-center">
      <span className="bg-accent-soft text-accent flex size-12 items-center justify-center rounded-full">
        <ListChecks aria-hidden className="size-6" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-semibold">問題はまだありません</p>
        <p className="text-muted text-sm leading-relaxed [word-break:auto-phrase]">
          資料の画面で「解説と確認問題を作る」を押すと、ここに並びます。
        </p>
      </div>
      <Link
        href="/materials"
        className="bg-foreground text-background hover:bg-foreground/85 inline-flex items-center justify-center gap-2 rounded-sm px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors"
      >
        <FileText aria-hidden className="size-4" />
        資料を開く
      </Link>
    </div>
  );
}

function StatusBadge({ isPublic }: { isPublic: boolean }) {
  return isPublic ? (
    <span className="border-success/40 bg-success/10 text-success inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs font-semibold whitespace-nowrap">
      <Globe aria-hidden className="size-3.5" />
      公開中
    </span>
  ) : (
    <span className="border-line text-muted inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-xs whitespace-nowrap">
      <Lock aria-hidden className="size-3.5" />
      未公開
    </span>
  );
}

function QuestionItem({
  question,
  number,
  onPublished,
}: {
  question: Question;
  number: number;
  onPublished: (shareId: string) => void;
}) {
  // 確認の表示を出しているか
  const [confirming, setConfirming] = useState(false);
  const [publishing, setPublishing] = useState(false);
  // この画面で公開したところか（「公開しました」を出し、コピーのボタンに移る）
  const [justPublished, setJustPublished] = useState(false);
  // 公開に失敗したときに出す文（失敗していなければ null）
  const [error, setError] = useState<string | null>(null);

  // 確認を開いたら確認の文へ、閉じたら元のボタンへ、キーボードの位置を移す
  const confirmRef = useRef<HTMLDivElement>(null);
  // 共通のボタンは ref を受け取らないので、id で探す
  const openButtonId = `publish-${question.id}`;
  const wasConfirming = useRef(false);
  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
    else if (wasConfirming.current)
      document.getElementById(openButtonId)?.focus();
    wasConfirming.current = confirming;
  }, [confirming, openButtonId]);

  async function handlePublish() {
    if (publishing) return;
    setPublishing(true);
    setError(null);
    try {
      const { shareId } = await publish(question.id);
      // 公開したあとはコピーのボタンへ移るので、元のボタンには戻さない
      wasConfirming.current = false;
      setConfirming(false);
      setJustPublished(true);
      onPublished(shareId);
    } catch (e) {
      setError(`公開できませんでした。${errorMessage(e)}`);
    } finally {
      setPublishing(false);
    }
  }

  return (
    <article
      aria-labelledby={`question-${question.id}`}
      className="flex flex-col gap-4"
    >
      <header className="flex items-center justify-between gap-3">
        <h2
          id={`question-${question.id}`}
          className="font-display text-muted text-base font-semibold tracking-[0.14em]"
        >
          <span className="sr-only">問題 {number}</span>
          <span aria-hidden>Q{questionNumber(number)}</span>
        </h2>
        <StatusBadge isPublic={question.isPublic} />
      </header>

      <p className="leading-relaxed font-medium [word-break:auto-phrase]">
        {question.prompt}
      </p>

      <ol className="flex flex-col gap-2" aria-label="選択肢">
        {question.choices.map((choice, i) => {
          const isAnswer = i === question.answerIndex;
          return (
            <li
              key={i}
              className={`flex items-start gap-3 rounded-sm border px-3 py-2.5 text-sm ${
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
                <span className="text-success inline-flex shrink-0 items-center gap-1 pt-0.5 text-xs font-semibold whitespace-nowrap">
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

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-muted text-xs leading-relaxed [word-break:auto-phrase]">
          AI が作った問題は間違うことがあります。
        </p>
        <Link
          href={`/materials/${question.materialId}`}
          className="text-accent inline-flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap underline-offset-4 hover:underline"
        >
          <FileText aria-hidden className="size-4" />
          元の資料と見比べる
        </Link>
      </div>

      {question.isPublic ? (
        <div className="border-line bg-surface flex flex-col gap-3 rounded-sm border p-4 transition-[opacity,translate] duration-200 starting:translate-y-1 starting:opacity-0">
          {justPublished ? (
            <p
              role="status"
              className="text-success flex items-center gap-2 text-sm font-semibold"
            >
              <CircleCheck aria-hidden className="size-4 shrink-0" />
              公開しました。URL をコピーして友達に送れます。
            </p>
          ) : (
            <p className="text-muted text-sm leading-relaxed [word-break:auto-phrase]">
              公開中です。URL を知っている人が、登録せずに回答できます。
            </p>
          )}
          {question.shareId && (
            <CopyShareUrl
              shareId={question.shareId}
              autoFocus={justPublished}
            />
          )}
        </div>
      ) : confirming ? (
        <div
          ref={confirmRef}
          tabIndex={-1}
          role="group"
          aria-labelledby={`confirm-${question.id}`}
          className="border-accent/40 bg-accent-soft/50 flex flex-col gap-3 rounded-sm border p-4 transition-[opacity,translate] duration-200 outline-none starting:translate-y-1 starting:opacity-0"
        >
          <p
            id={`confirm-${question.id}`}
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <ShieldCheck aria-hidden className="text-accent size-4 shrink-0" />
            公開する前に確認してください
          </p>
          <ul className="flex flex-col gap-1.5 text-sm leading-relaxed">
            <li className="flex items-start gap-2">
              <Globe
                aria-hidden
                className="text-muted mt-1 size-3.5 shrink-0"
              />
              <span className="[word-break:auto-phrase]">
                URL
                を知っている人は誰でも、この問題文・選択肢・解説を見られます。
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Lock aria-hidden className="text-muted mt-1 size-3.5 shrink-0" />
              <span className="[word-break:auto-phrase]">
                元の板書画像と資料は公開されません。
              </span>
            </li>
          </ul>
          {error && (
            <p
              role="alert"
              className="text-danger text-sm leading-relaxed [word-break:auto-phrase]"
            >
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              onClick={handlePublish}
              loading={publishing}
              icon={<Globe aria-hidden className="size-4" />}
              className="flex-1 whitespace-nowrap"
            >
              {publishing ? "公開しています" : "公開する"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setConfirming(false);
                setError(null);
              }}
              disabled={publishing}
              className="whitespace-nowrap"
            >
              やめる
            </Button>
          </div>
        </div>
      ) : (
        <Button
          id={openButtonId}
          variant="secondary"
          onClick={() => setConfirming(true)}
          icon={<Globe aria-hidden className="size-4" />}
          className="w-full whitespace-nowrap sm:w-auto sm:self-start"
        >
          確認して公開する
        </Button>
      )}
    </article>
  );
}
