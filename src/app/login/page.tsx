// front 担当のファイル（ログイン画面）。
// フォーム本体は入力やボタンの状態を持つので、src/components/login-form.tsx（Client Component）に分けている。
// 毎日開く画面なので、ブランドの TOUKOU とフォームだけにする（説明文や標語は置かない）。画面の高さに収め、縦の真ん中に置く。
import type { Metadata } from "next";

import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "ログイン | TOUKOU",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col justify-center px-6 pb-[12dvh]">
      {/* ブランド：ナビと同じ書体の文字だけのロゴと、琥珀色の短い線 */}
      <header className="flex flex-col gap-4">
        <p className="font-display text-3xl leading-none font-semibold tracking-[0.18em]">
          TOUKOU
        </p>
        <span aria-hidden className="bg-accent block h-0.5 w-8" />
      </header>

      <section aria-labelledby="login-heading" className="mt-10">
        <h1 id="login-heading" className="text-lg">
          ログイン
        </h1>
        <div className="mt-5">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
