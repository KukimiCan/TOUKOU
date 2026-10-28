# DB+security 担当

データを保存するテーブル、ログイン、そして「誰が何を見られるか」を守る役割です。
TOUKOU は講義資料や板書という**本人の大事なデータ**を扱うので、セキュリティはこの役割が責任を持ちます。

## 触るフォルダ

| フォルダ               | 置くもの                                      |
| ---------------------- | --------------------------------------------- |
| `supabase/migrations/` | テーブル、RLS、Storage の設定（SQL）          |
| `supabase/config.toml` | Supabase CLI の設定                           |
| `src/lib/supabase/`    | Supabase クライアント、DB の型                |
| `src/proxy.ts`         | ログイン状態の更新（認証の issue で追加する） |

**触らないもの：** 画面（front）、API の処理（back）、AI の関数（AI）

## 最初にやること

1. **Supabase の開発用プロジェクトを 1 つ作る**（https://supabase.com/dashboard ）。チーム全員でこの 1 つを使う
2. Project Settings から URL と Publishable key、Secret key を確認し、**安全な方法で**チームに共有する（公開のチャンネルや GitHub に貼らない）
3. 仕様書の [6 章 データ](../spec.md#6-データ仮決めdbsecurity-担当が-migration-で確定する) を元にテーブルを作る

## テーブルの変更のしかた（migration）

テーブルの変更は、必ず SQL ファイル（migration）にして PR で共有します。ダッシュボードで直接変えたままにしないでください（他の人の環境と食い違います）。

```bash
npx supabase login
npx supabase link --project-ref <プロジェクトの ID>
npx supabase migration new create_courses
# supabase/migrations/<日時>_create_courses.sql ができるので、SQL を書く
npx supabase db push
```

DB の型を TypeScript に出力して、back が使えるようにします。

```bash
npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
```

## セキュリティで守ること（[spec.md 7 章](../spec.md#7-守ることプライバシーと-ai)）

- **すべてのテーブルで RLS を有効にする。** 有効にしないと、誰でも全員のデータを読めてしまう
- 基本のポリシー：自分の行（`user_id = auth.uid()`）だけ読み書きできる
- 共有された問題：`is_public = true` の問題だけ、ログインしていない人も読める。回答は誰でも追加できるが、他人の回答は読めない
- 板書の画像は **非公開の Storage バケット**に置く。共有ページで画像は出さない
- `SUPABASE_SECRET_KEY` は RLS を無視できる強いキー。サーバー側のコードだけで、本当に必要なときだけ使う。`NEXT_PUBLIC_` を付けない
- 共有 URL の ID は推測されにくいもの（UUID など）にする

## 確認方法

- Supabase ダッシュボードの Table Editor で、テーブルができているか見る
- **RLS の確認**：2 つのテストユーザーを作り、片方のデータがもう片方から見えないことを確かめる
- ダッシュボードの Advisors（Security Advisor）で警告が無いか見る

## AI エージェントへの頼み方の例

```
DB+security 担当です。issue #10 をやります。
docs/spec.md の 6 章を元に、courses テーブルの migration を作りたいです。
RLS を有効にして、自分の行だけ読み書きできるポリシーも付けてください。
docs/roles/db-security.md の手順に従ってください。まず SQL の案を説明してください。
```
