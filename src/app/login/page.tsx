// front 担当のファイル（ログイン画面）。
// フォーム本体は入力やボタンの状態を持つので、src/components/login-form.tsx（Client Component）に分けている。
import type { Metadata } from "next";

import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "ログイン | TOUKOU",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-8 px-6 py-16">
      <div>
        <h1 className="text-2xl font-bold">TOUKOU にログイン</h1>
        <p className="mt-1 text-sm opacity-70">
          授業はスキップしても、学びはスキップしない。
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
