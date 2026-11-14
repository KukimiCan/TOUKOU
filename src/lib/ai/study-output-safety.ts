// AI の出力は資料中の指示に誘導され得る。保存前に、明白な命令の持ち込みを拒否する。
// これは既知の形を検出する補助策で、元資料との事実関係を証明するものではない。
const unsafePatterns = [
  /(?:https?:\/\/|www\.|mailto:|javascript:|data:(?:text|application|image)\/)/iu,
  /\\(?:href|url|includegraphics|htmlClass|htmlStyle|htmlId|htmlData)\b/iu,
  /<\|(?:im_start|im_end)\|>/iu,
  /\b(?:ignore|disregard|forget|override)\b.{0,50}\b(?:previous|prior|system|developer)\b.{0,30}\b(?:instructions?|prompts?|rules?)\b/iu,
  /(?:これまで|以前|上記|前述|システム|開発者).{0,24}(?:指示|命令|プロンプト|ルール).{0,24}(?:無視|忘れ|上書き|従わ)/u,
  /(?:API[ _-]?key|secret|password|秘密鍵|認証情報).{0,40}(?:送信|出力|公開|教え|send|post|print)/iu,
];

function containsUnsafeText(text: string): boolean {
  // 全角英字やゼロ幅文字を使った単純な表記揺れも同じ形で検査する。
  const normalized = text
    .normalize("NFKC")
    .replace(/[\u200b-\u200f\u2060\ufeff]/gu, "");
  return unsafePatterns.some((pattern) => pattern.test(normalized));
}

export class UnsafeStudyOutputError extends Error {
  constructor() {
    // 入力や AI の出力をログに残さない。
    super("AI の生成結果に資料外の指示が含まれています");
  }
}

export function assertSafeStudyOutput(value: unknown): void {
  if (typeof value === "string") {
    if (containsUnsafeText(value)) throw new UnsafeStudyOutputError();
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) assertSafeStudyOutput(item);
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const item of Object.values(value)) assertSafeStudyOutput(item);
  }
}
