// front 担当のファイル（設定画面）。
// 各ユーザーが自分の AI のキーを登録する（#220）。読み込みと保存は ai-key-settings.tsx が API で行う。
import type { Metadata } from "next";

import { AiKeySettings } from "@/components/ai-key-settings";

export const metadata: Metadata = {
  title: "AI のキー | TOUKOU",
};

export default function SettingsPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col">
      <AiKeySettings />
    </main>
  );
}
