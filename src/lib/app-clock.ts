// 画面と計算で使う「今」の時刻（#216）。
// 最終発表のデモ（日曜）で平日の様子を見せるため、環境変数 NEXT_PUBLIC_DEMO_TIME_OFFSET_MINUTES の分だけ時刻をずらす。
// 未設定なら本当の時刻。時計は止めずに進む（ずらす量だけ足す）。
// 本当の時刻のままにするもの：キャッシュ、作成日時、回数制限、体験用アカウントの期限
const OFFSET_MS =
  (Number(process.env.NEXT_PUBLIC_DEMO_TIME_OFFSET_MINUTES ?? 0) || 0) * 60_000;

export function appNowMs(): number {
  return Date.now() + OFFSET_MS;
}

export function appNow(): Date {
  return new Date(appNowMs());
}
