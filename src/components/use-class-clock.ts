// front 担当のファイル。
// 次の授業カードの部品（カウントダウン、移動開始の目安）で使う「時計」のフック。
// フック = 画面の部品どうしで使い回せる処理。端末の時刻を 1 秒ごとに読み直す。
"use client";

import { useEffect, useState } from "react";

export type ClassClock = {
  // いまの時刻（ミリ秒）
  now: number;
  // API の時刻に足す「ずらし幅」（ミリ秒）。ふだんは 0
  // 仮データは開始時刻が過去なので、「開始時刻が過去なのに残り時間がある」ときだけ、
  // 開始がちょうど残り時間（分）の後になるように、すべての時刻を同じだけずらす
  shift: number;
};

// サーバーで描画するときは時刻が分からないので、画面に出てから時計を動かす（それまでは null）
export function useClassClock(
  startsAt: string,
  minutesUntilStart: number,
): ClassClock | null {
  const [clock, setClock] = useState<ClassClock | null>(null);

  useEffect(() => {
    const getShift = (now: number) => {
      const start = new Date(startsAt).getTime();
      return start <= now && minutesUntilStart > 0
        ? now + minutesUntilStart * 60_000 - start
        : 0;
    };
    // ずらし幅は最初の 1 回だけ決める（毎回決めると、数字が減らなくなる）
    let shift: number | null = null;
    const tick = () => {
      const now = Date.now();
      shift ??= getShift(now);
      setClock({ now, shift });
    };

    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [startsAt, minutesUntilStart]);

  return clock;
}
