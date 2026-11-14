// front 担当のファイル。
// 問題の表示に使う小さな道具（問題の確認・公開 #70 と共有ページ #72・#73 で使い回す）。

// 選択肢の頭に付ける記号（選択肢は 2〜6 個）
export const CHOICE_LABELS = ["A", "B", "C", "D", "E", "F"];

// 問題の番号を 2 桁にそろえる（例：1 → "01"）。「Q01」のように見出しで使う
export function questionNumber(n: number) {
  return String(n).padStart(2, "0");
}
