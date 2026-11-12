// front 担当のファイル。
// 公開した問題の共有 URL を、ボタン 1 つでコピーする（#71）。
// - コピーできたら、ボタンの文字と読み上げ用のお知らせで「コピーしました」と伝える
// - スマホから http（例：http://192.168.x.x:3000）で開くと、新しいコピーの仕組み（Clipboard API）は使えない。
//   そのときは古い仕組み（execCommand）で試し、それもだめなら URL を表示して長押しでコピーしてもらう
"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  shareId: string;
};

type Status = "idle" | "copied" | "failed";

// 「コピーしました」を出しておく時間（ミリ秒）
const COPIED_MS = 2000;

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

export function CopyShareUrl({ shareId }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [url, setUrl] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // 画面を離れたら、「コピーしました」を消すタイマーを止める
  useEffect(() => () => clearTimeout(timer.current), []);

  async function handleCopy() {
    // URL は、いま開いているサイトのアドレスから作る（ブラウザでしか分からないので、押したときに作る）
    const shareUrl = `${window.location.origin}/q/${shareId}`;
    setUrl(shareUrl);
    const ok = await copyText(shareUrl);
    setStatus(ok ? "copied" : "failed");
    clearTimeout(timer.current);
    if (ok) {
      timer.current = setTimeout(() => setStatus("idle"), COPIED_MS);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className={`flex items-center justify-center gap-2 rounded px-4 py-3 font-semibold ${
          status === "copied"
            ? "bg-emerald-600 text-white"
            : "bg-foreground text-background"
        }`}
      >
        {status === "copied" ? (
          <>
            {/* チェックの印 */}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="m5 12 5 5 9-10" />
            </svg>
            コピーしました
          </>
        ) : (
          "共有 URL をコピー"
        )}
      </button>

      {/* 読み上げソフトにも結果を伝える */}
      <p role="status" className="sr-only">
        {status === "copied" ? "共有 URL をコピーしました" : ""}
      </p>

      {status === "failed" && (
        <div className="flex flex-col gap-1">
          <p role="alert" className="text-sm">
            自動でコピーできませんでした。下の URL
            を長押し（パソコンでは選択）してコピーしてください。
          </p>
          <input
            type="text"
            readOnly
            value={url}
            onFocus={(event) => event.target.select()}
            className="rounded border border-current/30 bg-transparent px-3 py-2 text-base"
          />
        </div>
      )}
    </div>
  );
}
