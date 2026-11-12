// back 担当のファイル。
// 次の授業の開始時刻から、残り時間と「移動を始める時刻」を求める。DB を使わない計算だけの関数。
//
// 決めたこと:
// - 移動を始める時刻 = 開始時刻 − 移動の余裕時間
// - 残り時間（分）は切り捨て。59 秒残りなら 0 分（遅刻しにくい側に寄せる）
// - 移動を始める時刻を過ぎたら shouldLeaveNow を true にする。leaveAt は過去の時刻のまま返す
//   （画面で「もう出発の時間です」と出せるようにするため）

const MINUTE_MS = 60 * 1000;

export type LeaveTime = {
  minutesUntilStart: number;
  leaveAt: Date;
  shouldLeaveNow: boolean;
};

export function calcLeaveTime(
  now: Date,
  startsAt: Date,
  travelBufferMinutes: number,
): LeaveTime {
  const msUntilStart = startsAt.getTime() - now.getTime();
  const leaveAt = new Date(
    startsAt.getTime() - travelBufferMinutes * MINUTE_MS,
  );

  return {
    minutesUntilStart: Math.max(0, Math.floor(msUntilStart / MINUTE_MS)),
    leaveAt,
    shouldLeaveNow: now.getTime() >= leaveAt.getTime(),
  };
}
