# src/features（back 担当）

アプリの処理の本体を、機能ごとのフォルダに置きます。API（`src/app/api/**/route.ts`）からはここの関数を呼ぶだけにします。

- 例：`timetable/next-class.ts`（次の授業を求める計算）
- 計算は DB や AI を使わない関数にしておくと、確認しやすい
- 見本：`health/check-health.ts`
