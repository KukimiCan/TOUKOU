// front 担当のファイル（ログイン画面）。
// フォーム本体は入力やボタンの状態を持つので、src/components/login-form.tsx（Client Component）に分けている。
// 最初に目にする画面なので、ブランド名と一言の説明で「何のアプリか」を伝え、あとはフォームだけに絞る。
import type { Metadata } from "next";

import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "ログイン | TOUKOU",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12 sm:py-20">
      {/* ブランド：ナビと同じ書体の文字だけのロゴと、琥珀色の短い線 */}
      <header>
        <p className="font-display text-3xl leading-none font-semibold tracking-[0.18em]">
          TOUKOU
        </p>
        <span aria-hidden className="bg-accent mt-4 block h-0.5 w-8" />
        <p className="text-muted mt-4 text-sm [word-break:auto-phrase]">
          時間割と講義資料から、次の授業・復習・空きコマの使い方まで手伝う、大学生のための学習アプリです。
        </p>
      </header>

      {/* フォーム：見出しは小さく、罫線で区切る */}
      <section
        aria-labelledby="login-heading"
        className="border-line mt-10 border-t pt-8"
      >
        <h1 id="login-heading" className="text-xl">
          ログイン
        </h1>
        <div className="mt-6">
          <LoginForm />
        </div>
      </section>

      <p className="text-muted mt-12 text-xs [word-break:auto-phrase]">
        授業はスキップしても、学びはスキップしない。
      </p>
    </main>
  );
}
