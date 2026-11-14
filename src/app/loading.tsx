// front 担当のファイル。
// ホームを開くときの読み込み中の表示。ホームと同じ枠・同じ形の骨格を出し、表示に切り替わったときに形が跳ねないようにする。
import { HomeSkeleton } from "@/components/home-content";
import { Mascot } from "@/components/mascot";
import { Screen } from "@/components/ui/screen";

export default function Loading() {
  return (
    <Screen label="Today" title="ホーム" hideTitle>
      {/* 待っている間の主役。骨格はその下で、表示に切り替わる形を先に見せる */}
      <div className="flex shrink-0 justify-center">
        <Mascot expression="smug" size={112} bob />
      </div>
      <HomeSkeleton />
    </Screen>
  );
}
