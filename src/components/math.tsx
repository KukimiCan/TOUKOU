// front 担当のファイル。
// LaTeX（数式の書き方）を KaTeX で描画する（#数式）。
// - MathTex：1 つの数式を描画する。書式が壊れていて描画できないときは、元の文字を等幅で出す
// - RichText：文章の中の $...$（行内）と $$...$$（行の中央に出す数式）を描画し、それ以外は文字のまま出す
// "use client" は不要。サーバーでも描画できる。
import type { ReactNode } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

// 数式 1 つ。display のときは行の中央に大きく出す（<div>）。行内のときは文字と同じ行に出す（<span>）
export function MathTex({
  tex,
  display = false,
  className,
}: {
  tex: string;
  display?: boolean;
  className?: string;
}) {
  // throwOnError: false のとき、書式が壊れた数式は例外ではなく「katex-error」の印が付いた文字になる。
  // どちらの場合も、元の文字を等幅で出す（読めなくなるよりは、そのまま見せる）
  let html: string | null = null;
  try {
    const out = katex.renderToString(tex, {
      throwOnError: false,
      displayMode: display,
      output: "html",
    });
    if (!out.includes("katex-error")) html = out;
  } catch {
    html = null;
  }

  if (html === null) {
    return display ? (
      <div
        className={`overflow-x-auto font-mono text-sm whitespace-pre ${className ?? ""}`}
      >
        {tex}
      </div>
    ) : (
      <code className={`font-mono text-sm ${className ?? ""}`}>{tex}</code>
    );
  }

  if (display) {
    // 長い数式がスマホで横にはみ出さないよう、枠の中だけで横にスクロールさせる
    return (
      <div className={`overflow-x-auto py-1 ${className ?? ""}`}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    );
  }
  return (
    <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

// $...$（行内）と $$...$$（行の中央）を数式として描画する。
// $ の数が奇数（対になっていない）ときは、AI の書き間違いとみなし、全体をそのまま文字で出す。
export function RichText({ text }: { text: string }) {
  const count = (text.match(/\$/g) ?? []).length;
  if (count % 2 === 1) return <>{text}</>;

  // 「$$...$$」を先に拾う（順番が逆だと、$$ の 1 つ目を行内の区切りと取り違える）
  const pattern = /\$\$([^$]+?)\$\$|\$([^$]+?)\$/g;
  const parts: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    const display = match[1] !== undefined;
    const tex = display ? match[1] : match[2];
    parts.push(<MathTex key={key++} tex={tex} display={display} />);
    last = index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
