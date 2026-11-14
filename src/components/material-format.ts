// front 担当のファイル。
// 資料の表示に使う小さな道具（資料一覧 #67 と資料詳細 #68 で使い回す）。
import type { MaterialKind } from "@/contracts/materials";

// 資料の種類の呼び方
export const MATERIAL_KIND_LABELS: Record<MaterialKind, string> = {
  board: "板書",
  slide: "スライド・配布資料",
};

// サーバーとブラウザで同じ表示になるよう、時刻は日本時間に固定する
const dateFormat = new Intl.DateTimeFormat("ja-JP", {
  month: "numeric",
  day: "numeric",
  weekday: "short",
  timeZone: "Asia/Tokyo",
});
const timeFormat = new Intl.DateTimeFormat("ja-JP", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Tokyo",
});

// 資料を追加した日時。例：「11/2(月) 10:35」
export function formatCreatedAt(createdAt: string) {
  const date = new Date(createdAt);
  return `${dateFormat.format(date)} ${timeFormat.format(date)}`;
}

// ファイルの大きさ。例：「1.2 MB」「840 KB」
export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

// 経過時間。例：「0:42」「1:05」
export function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// 「1 次」「n 本」のように、数字・英字と後ろの日本語の間の空白で改行しないよう、改行しない空白に置き換える
export function keepNumbersTogether(text: string) {
  return text.replace(/([0-9A-Za-z]) (?=[^\s\x00-\x7F])/g, "$1\u00a0");
}
