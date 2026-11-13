# API 一覧

front と back の約束の一覧です。型の正本は `src/contracts/` にあります。
API を追加・変更したら、この表も同じ PR で更新してください。

状態：✅ 実装済み / 🚧 作業中 / 📝 予定

| 状態 | メソッド       | パス                            | 内容                                                                    | contracts      |
| ---- | -------------- | ------------------------------- | ----------------------------------------------------------------------- | -------------- |
| ✅   | GET            | `/api/health`                   | 開発環境の確認（Supabase と AI の設定状況）                             | `health.ts`    |
| 🚧   | GET / POST     | `/api/courses`                  | 時間割の科目の一覧・登録（DB に保存。ログイン後の確認は未実施）         | `courses.ts`   |
| 🚧   | PATCH / DELETE | `/api/courses/[id]`             | 科目の変更・削除                                                        | `courses.ts`   |
| 🚧   | GET / PATCH    | `/api/settings`                 | 時限の時刻、移動の余裕時間                                              | `settings.ts`  |
| 🚧   | GET            | `/api/home`                     | 次の授業、移動開始の目安（復習・空きコマ提案は空）                      | `home.ts`      |
| 🚧   | POST           | `/api/auth/login`               | ログイン（メールとパスワード。成功で cookie を付ける。失敗は 401）      | `auth.ts`      |
| 🚧   | POST           | `/api/auth/logout`              | ログアウト（セッションを終わらせ、cookie を消す）                       | `auth.ts`      |
| 🚧   | GET / POST     | `/api/materials`                | 資料・板書の一覧・アップロード（DB に保存し、画像は #29 の Storage へ） | `materials.ts` |
| 🚧   | GET            | `/api/materials/[id]`           | 資料の詳細と AI の解説（元画像は下の image の URL）                     | `materials.ts` |
| 🚧   | GET            | `/api/materials/[id]/image`     | 元の板書画像（本人だけ。他人と無い ID は 404）                          | `materials.ts` |
| 🚧   | POST           | `/api/materials/[id]/generate`  | AI で要約・解説・確認問題を作る                                         | `materials.ts` |
| 🚧   | GET            | `/api/questions`                | 問題の一覧（本人の分だけ。作成は #47 の生成）                           | `questions.ts` |
| 🚧   | POST           | `/api/questions/[id]/publish`   | 問題を公開して共有 URL を発行                                           | `questions.ts` |
| 🚧   | GET            | `/api/shared/[shareId]`         | 共有された問題を取得（ログイン不要）                                    | `questions.ts` |
| 🚧   | POST           | `/api/shared/[shareId]/answers` | 共有された問題に回答（ログイン不要。連投は 429）                        | `questions.ts` |

予定の API は仮決めです。担当者が issue で決めて変えてかまいません。

## 共通の決まり（仮決め）

- 入出力は JSON。項目名は camelCase（`startTime` など）
- エラーは `{ "error": "人が読めるメッセージ" }` と、適切なステータスコード（400 入力が不正、401 ログインしていない、404 見つからない、429 短い間に送りすぎ、500 サーバーの問題）
- ログインが必要な API は、ログインしていなければ 401 を返す
