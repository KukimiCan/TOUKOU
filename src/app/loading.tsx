// front 担当のファイル。
// ホームを開くときの読み込み中の表示。ホームと同じ枠・同じ形の骨格を出し、表示に切り替わったときに形が跳ねないようにする。
import { HomeSkeleton } from "@/components/home-content";
import { Screen } from "@/components/ui/screen";

export default function Loading() {
  return (
    <Screen label="Today" title="ホーム" hideTitle>
      <HomeSkeleton />
    </Screen>
  );
}
