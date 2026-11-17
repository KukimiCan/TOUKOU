// back 担当のファイル。
// ユーザーの AI のキーを、DB に入れる前に暗号化する（#220）。
// - 方式は AES-256-GCM。鍵はサーバーだけが知る AI_KEY_ENCRYPTION_SECRET から作る（DB には置かない）
// - ユーザーの ID を「追加の認証データ」にするので、暗号文を別のユーザーの行へ写しても復号できない
// - 形式は "v1.<iv>.<tag>.<暗号文>"（どれも base64url）。方式を変えるときは v2 にして、v1 も読めるようにする
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const VERSION = "v1";

function encryptionKey(): Buffer {
  const secret = process.env.AI_KEY_ENCRYPTION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AI_KEY_ENCRYPTION_SECRET が無いか短すぎます（32 文字以上）。.env.example の作り方で設定してください。",
    );
  }
  return createHash("sha256").update(secret).digest();
}

export function hasEncryptionSecret() {
  return (process.env.AI_KEY_ENCRYPTION_SECRET?.length ?? 0) >= 32;
}

export function encryptAiKey(userId: string, apiKey: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(userId));
  const body = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv, tag, body]
    .map((part) =>
      typeof part === "string" ? part : part.toString("base64url"),
    )
    .join(".");
}

// 復号できない（壊れている、鍵が変わった、別のユーザーの行）ときは null
export function decryptAiKey(userId: string, stored: string): string | null {
  const [version, iv, tag, body] = stored.split(".");
  if (version !== VERSION || !iv || !tag || !body) return null;
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(iv, "base64url"),
    );
    decipher.setAAD(Buffer.from(userId));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(body, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}
