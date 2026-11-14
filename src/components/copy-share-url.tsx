// front 担当のファイル。
// 公開した問題の共有 URL を、ボタン 1 つでコピーする（#71）。
// - コピーする URL を、ボタンの上に小さく出す（何が送られるかが分かる）
// - コピーできたら、ボタンの色・アイコン・文字と、読み上げ用のお知らせで「コピーしました」と伝える
// - スマホから http（例：http://192.168.x.x:3000）で開くと、新しいコピーの仕組み（Clipboard API）は使えない。
//   そのときは古い仕組み（execCommand）で試し、それもだめなら URL を表示して長押しでコピーしてもらう
"use client";

import { Check, Copy, Link2 } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { Button } from "./ui/button";

type Props = {
  shareId: string;
  // 出したときに、このボタンへキーボードの位置を移すか（公開した直後に使う）
  autoFocus?: boolean;
};

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

async function copyText(text: string) {
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

export function CopyShareUrl({ shareId, autoFocus = false }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const origin = useOrigin();
  const url = `${origin}/q/${shareId}`;

  // 画面を離れたら、「コピーしました」を消すタイマーを止める
  useEffect(() => () => clearTimeout(timer.current), []);

  async function handleCopy() {
    const ok = await copyText(`${window.location.origin}/q/${shareId}`);
    setStatus(ok ? "copied" : "failed");
    clearTimeout(timer.current);
    if (ok) {
      timer.current = setTimeout(() => setStatus("idle"), COPIED_MS);
    }
  }

  const copied = status === "copied";

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted flex min-w-0 items-center gap-1.5 text-xs">
        <Link2 aria-hidden className="size-3.5 shrink-0" />
        <span className="sr-only">共有 URL：</span>
        <span className="truncate font-mono tracking-wide">{url}</span>
      </p>

      <Button
        type="button"
        onClick={handleCopy}
        autoFocus={autoFocus}
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
        className={`w-full whitespace-nowrap sm:w-56 sm:self-start ${
          copied ? "border-success! bg-success/10! text-success!" : ""
        }`}
      >
        {copied ? "コピーしました" : "共有 URL をコピー"}
      </Button>

      {/* 読み上げソフトにも結果を伝える */}
      <p role="status" className="sr-only">
        {copied ? "共有 URL をコピーしました" : ""}
      </p>

      {status === "failed" && (
        <div className="flex flex-col gap-1.5">
          <p
            role="alert"
            className="text-sm leading-relaxed [word-break:auto-phrase]"
          >
            自動でコピーできませんでした。下の URL
            を長押し（パソコンでは選択）してコピーしてください。
          </p>
          <input
            type="text"
            readOnly
            aria-label="共有 URL"
            value={url}
            onFocus={(event) => event.target.select()}
            className="w-full text-base"
          />
        </div>
      )}
    </div>
  );
}
