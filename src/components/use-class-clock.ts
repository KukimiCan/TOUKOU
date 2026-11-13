// front 担当のファイル。
// 次の授業カードで使う「時計」のフック。
// フック = 画面の部品どうしで使い回せる処理。端末の時刻を 1 秒ごとに読み直す。
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
