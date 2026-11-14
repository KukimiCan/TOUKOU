// back 担当のファイル。
// 共有された問題への回答（ログイン不要）の連投を抑える（#154）。DB を使わない計算だけの道具。
//
// 決めたこと:
// - 数える単位は「送信元（IP アドレス）× 問題（shareId）」。同じ送信元が同じ問題に何度も送るのを止める
// - 1 分間に 60 回まで（会場の Wi-Fi など、大勢が同じ IP から答える場面に合わせる。#214）。超えたら、いちばん古い回答から 1 分たつまで受け付けない（route が 429 を返す）
// - 送信元が分からないときは、まとめて 1 つの送信元として数える（制限を素通りさせない）
// - 覚えておく送信元の数にも上限を置く（数える表そのものが増え続けないように）
//
// 制限が効く場所:
// - 回数はこのサーバーのメモリで数える。route が回答を保存する前に確かめる。
//   ただし Data API から answer_shared_question を直接呼ぶ経路は通らない（DB 側の対策は #170）
// - サーバーが複数台で動くと台ごとに数える。厳密にそろえるなら、DB か KV で数える形に変える
// - 送信元は x-forwarded-for の先頭を使う。Vercel ではこの値を Vercel が付け直すので信頼できる。
//   手元の開発サーバーでは送る側が自由に書けるので、確認用と考える

// 1 つの送信元が、1 つの問題に送れる回数と、その数え方の幅
export const ANSWER_LIMIT = 60;
export const ANSWER_WINDOW_MS = 60_000;

// 覚えておく「送信元 × 問題」の数の上限
const MAX_KEYS = 10_000;

// 「送信元 × 問題」ごとの、受け付けた時刻（ミリ秒）の一覧
const acceptedAt = new Map<string, number[]>();

export type AnswerRateResult =
  { allowed: true } | { allowed: false; retryAfterSeconds: number };

// リクエストの送信元（IP アドレス）。分からないときは "unknown"
export function answerSource(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

// 期限が切れた記録を消す。それでも多いときは、長く使われていないものから消す
function prune(now: number) {
  for (const [key, times] of acceptedAt) {
    if (times.every((time) => now - time >= ANSWER_WINDOW_MS)) {
      acceptedAt.delete(key);
    }
  }
  for (const key of acceptedAt.keys()) {
    if (acceptedAt.size <= MAX_KEYS) break;
    acceptedAt.delete(key);
  }
}

// 回答を受け付けてよいか確かめる。受け付けるときは、その 1 回を数に入れる
export function checkAnswerRate(
  source: string,
  shareId: string,
  now: number = Date.now(),
): AnswerRateResult {
  const key = `${source}|${shareId}`;
  const recent = (acceptedAt.get(key) ?? []).filter(
    (time) => now - time < ANSWER_WINDOW_MS,
  );

  if (recent.length >= ANSWER_LIMIT) {
    acceptedAt.set(key, recent);
    const waitMs = recent[0] + ANSWER_WINDOW_MS - now;
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(waitMs / 1000)),
    };
  }

  recent.push(now);
  // 入れ直して、最近使ったものが後ろに並ぶようにする（prune が古い順に消せる）
  acceptedAt.delete(key);
  acceptedAt.set(key, recent);
  if (acceptedAt.size > MAX_KEYS) prune(now);
  return { allowed: true };
}
