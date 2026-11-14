// 分の長さを、読みやすい日本語にする。画面やAIの文面で使う。
// 例：45 → "45 分"、80 → "1 時間 20 分"、120 → "2 時間"、1500 → "1 日 1 時間"、3094 → "2 日 3 時間"
// 24 時間以上は日と時間だけを出す（分は出さない）。

const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;

export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.floor(minutes));

  if (total < MINUTES_PER_HOUR) return `${total} 分`;

  const totalHours = Math.floor(total / MINUTES_PER_HOUR);
  if (totalHours < HOURS_PER_DAY) {
    const restMinutes = total % MINUTES_PER_HOUR;
    return restMinutes === 0
      ? `${totalHours} 時間`
      : `${totalHours} 時間 ${restMinutes} 分`;
  }

  const days = Math.floor(totalHours / HOURS_PER_DAY);
  const restHours = totalHours % HOURS_PER_DAY;
  return restHours === 0 ? `${days} 日` : `${days} 日 ${restHours} 時間`;
}
