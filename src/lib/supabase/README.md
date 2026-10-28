# src/lib/supabase（DB+security 担当）

Supabase に接続するクライアントを置きます。詳しくは `docs/roles/db-security.md`。

- `server.ts`：サーバー側（API、Server Component）で使う
- `client.ts`：ブラウザ側で使う（主にログイン操作）
- `env.ts`：環境変数の読み込み
- `database.types.ts`：DB の型（`npx supabase gen types` で出力する。テーブルができたら追加）
