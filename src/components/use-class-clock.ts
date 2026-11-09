// front 担当のファイル。
// 次の授業カードの部品（カウントダウン、移動開始の目安）で使う「時計」のフック。
// フック = 画面の部品どうしで使い回せる処理。端末の時刻を 1 秒ごとに読み直す。
// 仮データ用の時刻のずらしはここでは行わない（src/app/page.tsx の一時的な処理で行う）。
"use client";

import { useEffect, useState } from "react";

// いまの時刻（ミリ秒）を返す。
// サーバーで描画するときは時刻が分からないので、画面に出てから時計を動かす（それまでは null）
export function useClassClock(): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  return now;
}
