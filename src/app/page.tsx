// front 担当のファイル（ホーム画面）。
// 中身（次の授業カード、空き時間の過ごし方、短い復習）は、/api/home から取得して出す（#65）。
// 画面の枠（Screen）と、取得・読み込み中・エラーの表示は src/components/home-content.tsx にある。
// ホームは毎日開く画面なので、標語や説明は置かず、次の授業を主役にして 1 画面に収める。
import { HomeContent } from "@/components/home-content";

export default function Home() {
  return <HomeContent />;
}
