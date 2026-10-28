# API 一覧

front と back の約束の一覧です。型の正本は `src/contracts/` にあります。
API を追加・変更したら、この表も同じ PR で更新してください。

状態：✅ 実装済み / 🚧 作業中 / 📝 予定

| 状態 | メソッド       | パス                            | 内容                                             | contracts   |
| ---- | -------------- | ------------------------------- | ------------------------------------------------ | ----------- |
| ✅   | GET            | `/api/health`                   | 開発環境の確認（Supabase と AI の設定状況）      | `health.ts` |
| 📝   | GET / POST     | `/api/courses`                  | 時間割の科目の一覧・登録                         |             |
| 📝   | PATCH / DELETE | `/api/courses/[id]`             | 科目の変更・削除                                 |             |
| 📝   | GET / PATCH    | `/api/settings`                 | 時限の時刻、移動の余裕時間                       |             |
| 📝   | GET            | `/api/home`                     | 次の授業、移動開始の目安、短い復習、空きコマ提案 |             |
| 📝   | GET / POST     | `/api/materials`                | 資料・板書の一覧・アップロード                   |             |
| 📝   | GET            | `/api/materials/[id]`           | 資料の詳細と AI の解説                           |             |
| 📝   | POST           | `/api/materials/[id]/generate`  | AI で要約・解説・確認問題を作る                  |             |
| 📝   | GET / POST     | `/api/questions`                | 問題の一覧・作成                                 |             |
| 📝   | POST           | `/api/questions/[id]/publish`   | 問題を公開して共有 URL を発行                    |             |
| 📝   | GET            | `/api/shared/[shareId]`         | 共有された問題を取得（ログイン不要）             |             |
| 📝   | POST           | `/api/shared/[shareId]/answers` | 共有された問題に回答（ログイン不要）             |             |

予定の API は仮決めです。担当者が issue で決めて変えてかまいません。

## 共通の決まり（仮決め）

- 入出力は JSON。項目名は camelCase（`startTime` など）
- エラーは `{ "error": "人が読めるメッセージ" }` と、適切なステータスコード（400 入力が不正、401 ログインしていない、404 見つからない、500 サーバーの問題）
- ログインが必要な API は、ログインしていなければ 401 を返す
