// front 担当のファイル。
// 公開した問題の共有 URL をコピーする（#71）。
// - CopyShareUrl：URL と「コピー」ボタンを 1 行に並べる（何が送られるかが分かる）。問題の詳細（Modal）の下で使う
// - CopyShareIconButton：一覧の行に置く、アイコンだけのコピーのボタン（詳細を開かずに送り直せる）
// - コピーできたら、ボタンの色・アイコン・文字と、読み上げ用のお知らせで「コピーしました」と伝える
// - スマホから http（例：http://192.168.x.x:3000）で開くと、新しいコピーの仕組み（Clipboard API）は使えない。
//   そのときは古い仕組み（execCommand）で試し、それもだめなら URL の入力欄を出して長押しでコピーしてもらう
"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "./ui/button";

type Status = "idle" | "copied" | "failed";

// 「コピーしました」を出しておく時間（ミリ秒）
const COPIED_MS = 2000;

// いま開いているサイトのアドレス（例：https://toukou.example）。ブラウザでしか分からないので、サーバーでは空にする
const noSubscribe = () => () => {};
function useOrigin() {
  return useSyncExternalStore(
    noSubscribe,
    () => window.location.origin,
    () => "",
  );
}

export function shareUrl(shareId: string) {
  return `${window.location.origin}/q/${shareId}`;
}

// 古い仕組みでのコピー。見えない入力欄に URL を入れて選び、コピーする
function copyWithTextarea(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(textarea);
  return ok;
}

// 共有 URL をコピーする。できたら true
export async function copyShareUrl(shareId: string) {
  const text = shareUrl(shareId);
  if (window.isSecureContext && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 許可されなかったときなどは、古い仕組みで試す
    }
  }
  return copyWithTextarea(text);
}

// コピーの状態。「コピーしました」は少し経つと元に戻す
function useCopyStatus(initial: Status) {
  const [status, setStatus] = useState<Status>(initial);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (initial === "copied") {
      timer.current = setTimeout(() => setStatus("idle"), COPIED_MS);
    }
    return () => clearTimeout(timer.current);
  }, [initial]);

  function done(ok: boolean) {
    setStatus(ok ? "copied" : "failed");
    clearTimeout(timer.current);
    if (ok) timer.current = setTimeout(() => setStatus("idle"), COPIED_MS);
  }

  return [status, done] as const;
}

const copiedClass = "border-success! bg-success/10! text-success!";

export function CopyShareUrl({
  shareId,
  copied: copiedAtFirst = false,
}: {
  shareId: string;
  // 出したときに、もうコピーできているか（公開と同時にコピーしたとき）
  copied?: boolean;
}) {
  const [status, done] = useCopyStatus(copiedAtFirst ? "copied" : "idle");
  const origin = useOrigin();
  const url = `${origin}/q/${shareId}`;
  const copied = status === "copied";

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {status === "failed" ? (
          // 自動でコピーできなかったときは、選びやすい入力欄で出す
          <input
            type="text"
            readOnly
            autoFocus
            aria-label="共有 URL"
            aria-describedby={`copy-failed-${shareId}`}
            value={url}
            onFocus={(event) => event.target.select()}
            className="min-w-0 flex-1 font-mono text-sm"
          />
        ) : (
          <p className="text-muted min-w-0 flex-1 truncate font-mono text-xs tracking-wide">
            <span className="sr-only">共有 URL：</span>
            {url}
          </p>
        )}
        <Button
          type="button"
          onClick={async () => done(await copyShareUrl(shareId))}
          variant={copied ? "secondary" : "primary"}
          icon={
            copied ? (
              <Check
                aria-hidden
                className="size-4 transition-transform duration-200 starting:scale-50"
              />
            ) : (
              <Copy aria-hidden className="size-4" />
            )
          }
          className={`shrink-0 ${copied ? copiedClass : ""}`}
        >
          {copied ? "コピーしました" : "URL をコピー"}
        </Button>
      </div>

      {/* 読み上げソフトにも結果を伝える */}
      <p role="status" className="sr-only">
        {copied ? "共有 URL をコピーしました" : ""}
      </p>

      {status === "failed" && (
        <p
          id={`copy-failed-${shareId}`}
          role="alert"
          className="text-muted text-xs [word-break:auto-phrase]"
        >
          自動でコピーできませんでした。URL
          を長押し（パソコンでは選択）してコピーしてください。
        </p>
      )}
    </div>
  );
}

// 一覧の行に置く、アイコンだけのコピーのボタン。コピーできなかったときは onFailed（詳細を開く）を呼ぶ
export function CopyShareIconButton({
  shareId,
  label,
  onFailed,
}: {
  shareId: string;
  // 読み上げ用。例：「Q01 の共有 URL をコピー」
  label: string;
  onFailed: () => void;
}) {
  const [status, done] = useCopyStatus("idle");
  const copied = status === "copied";

  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={async () => {
          const ok = await copyShareUrl(shareId);
          done(ok);
          if (!ok) onFailed();
        }}
        className={`inline-flex size-11 shrink-0 items-center justify-center rounded-sm transition-colors ${
          copied
            ? "bg-success/10 text-success"
            : "text-muted hover:bg-surface hover:text-foreground"
        }`}
      >
        {copied ? (
          <Check
            aria-hidden
            className="size-4 transition-transform duration-200 starting:scale-50"
          />
        ) : (
          <Copy aria-hidden className="size-4" />
        )}
      </button>
      <span role="status" className="sr-only">
        {copied ? "共有 URL をコピーしました" : ""}
      </span>
    </>
  );
}
