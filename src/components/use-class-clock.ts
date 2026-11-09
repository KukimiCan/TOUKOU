// front 担当のファイル。
// 次の授業カードで使う「時計」のフック。
// フック = 画面の部品どうしで使い回せる処理。端末の時刻を 1 秒ごとに読み直す。
"use client";

import { useEffect, useState } from "react";

// API の時刻（startsAt、leaveAt など）とそのまま比べられる「いまの時刻」（ミリ秒）を返す。
// サーバーで描画するときは時刻が分からないので、画面に出てから時計を動かす（それまでは null）。
//
// 仮データは開始時刻が過去なので、「開始時刻が過去なのに残り時間がある」ときだけ、
// 「開始の minutesUntilStart 分前」を いまの時刻 とみなして、そこから時計を進める。
// （仮データが想定している「開いた時刻」を再現する。ふだんは端末の時刻そのまま）
export function useClassClock(
  startsAt: string,
  minutesUntilStart: number,
): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const getShift = (realNow: number) => {
      const start = new Date(startsAt).getTime();
      return start <= realNow && minutesUntilStart > 0
        ? start - minutesUntilStart * 60_000 - realNow
        : 0;
    };
    // ずらし幅は最初の 1 回だけ決める（毎回決めると、時計が進まなくなる）
    let shift: number | null = null;
    const tick = () => {
      const realNow = Date.now();
      shift ??= getShift(realNow);
      setNow(realNow + shift);
    };

    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [startsAt, minutesUntilStart]);

  return now;
}
