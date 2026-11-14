// back 担当のファイル。
// 体験用アカウントの期限（#216）。最終発表で聴衆に配るアカウントを、発表のあとは使えなくする。
// 期限は app_metadata.trial_expires_at（ISO 8601）に置く。app_metadata は利用者が書き換えられない。
// 期限の判定は本当の時刻で行う（デモ用に時刻をずらしても影響しない）。

export function isTrialExpired(
  appMetadata: unknown,
  now: number = Date.now(),
): boolean {
  if (!appMetadata || typeof appMetadata !== "object") return false;
  const raw = (appMetadata as Record<string, unknown>).trial_expires_at;
  if (typeof raw !== "string") return false;
  const expiresAt = Date.parse(raw);
  // 読めない値は期限切れとして扱う（誤って無期限にしない）
  if (Number.isNaN(expiresAt)) return true;
  return now >= expiresAt;
}
