# back 担当

API と、アプリの計算・処理を作る役割です。front（画面）と、AI・DB をつなぎます。

## 触るフォルダ

| フォルダ                      | 置くもの                                                     |
| ----------------------------- | ------------------------------------------------------------ |
| `src/app/api/<名前>/route.ts` | API の入口。`src/app/api/courses/route.ts` → `/api/courses`  |
| `src/features/<機能名>/`      | 処理の本体（次の授業の計算、空きコマの計算、資料の保存など） |
| `src/contracts/`              | API の入出力の型（共有。front と相談して決める）             |
| `src/mocks/`                  | 仮データ（共有）                                             |

**触らないもの：** 画面（front）、`src/lib/ai/`（AI）、`src/lib/supabase/` と `supabase/`（DB）

## 担当する主な処理（[spec.md](../spec.md)）

- 時間割の登録・取得
- 次の授業と、移動を始める時刻の計算（開始時刻 −「移動の余裕時間」）
- 空きコマの計算と提案（次の授業までの時間、締切、復習候補）
- 資料・板書のアップロードを受け取り、AI の関数を呼び、結果を保存する
- 問題の共有 URL の発行と、回答の受け付け

## 書き方の決まり

見本は `/api/health` です（`src/app/api/health/route.ts` → `src/features/health/check-health.ts`）。

1. **contracts を先に決める**：`src/contracts/<名前>.ts` に、リクエストとレスポンスの zod スキーマを書き、front に共有する
2. **route.ts は薄く**：入力を zod でチェック → `src/features/` の関数を呼ぶ → `Response.json(...)` で返す
3. **処理は features に**：計算は DB や AI を使わない純粋な関数にしておくと、確認しやすい
4. **DB には Supabase クライアント経由で**：`src/lib/supabase/server.ts` の `createClient()` を使う。ログイン中のユーザーとしてアクセスするので、他人のデータは RLS で弾かれる
5. **AI は `src/lib/ai/` の関数を呼ぶだけ**：プロンプトを back に書かない

## 確認方法

ブラウザや `curl` で API を直接呼んで確かめます。

```bash
curl http://localhost:3000/api/health
```

POST の API は AI エージェントに「この API を確かめる curl コマンドを作って」と頼むと楽です。

## AI エージェントへの頼み方の例

```
back 担当です。issue #15 をやります。
時間割から「次の授業」を返す API を作りたいです。
docs/roles/back.md の書き方の決まりに従って、まず src/contracts/ に型を提案してください。
次の授業を決める計算は src/features/timetable/ に、DB を使わない関数として作ってください。
```
