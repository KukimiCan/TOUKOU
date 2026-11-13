// back 担当のファイル。
// 今から次の授業の移動開始時刻までの空き時間を求める。DB を使わない計算だけの関数。
//
// 決めたこと:
// - 空き時間の終わり = 移動開始時刻（開始 − 移動の余裕時間）。移動の時間は空き時間に含めない
// - 次の授業が無い日（登録が無い、または週末で次が無い）は null を返す。空きコマの提案は出さない
// - 移動開始時刻を過ぎている・空きが 1 分も無いときは null
const MINUTE_MS = 60 * 1000;

export type FreeTime = {
  startsAt: Date;
  endsAt: Date;
  // 空き時間（分）。切り捨て
  minutes: number;
};

export function calcFreeTime(now: Date, leaveAt: Date | null): FreeTime | null {
  // 次の授業が無い日は空きコマを出さない
  if (leaveAt === null) return null;

  const minutes = Math.floor((leaveAt.getTime() - now.getTime()) / MINUTE_MS);
  if (minutes <= 0) return null;

  return { startsAt: now, endsAt: leaveAt, minutes };
}
