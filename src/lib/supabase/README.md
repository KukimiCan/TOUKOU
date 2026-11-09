# src/lib/supabase（DB+security 担当）

Supabase に接続するクライアントを置きます。詳しくは `docs/roles/db-security.md`。

- `server.ts`：サーバー側（API、Server Component）で使う
- `client.ts`：ブラウザ側で使う（主にログイン操作）
- `env.ts`：環境変数の読み込み
- `database.types.ts`：開発用 DB から生成した型。migration を追加したら再生成する

## back 担当向け：DB の型の使い方

`server.ts` の `createClient()` は `Database` 型を適用済みです。API やサーバー側の処理で使うと、`courses`・`profiles` の列名や値の型を TypeScript が確認します。

```ts
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

type CourseRow = Tables<"courses">;

export async function getCourses(): Promise<CourseRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("courses").select("*");
  if (error) throw error;
  return data;
}
```

`Tables<"courses">` は取得結果、`TablesInsert<"courses">` は追加時の値の型です。DB の列名は `day_of_week`・`user_id` のように snake_case、API の入出力は `dayOfWeek` のように camelCase なので、back 側で変換してください。接続には Publishable key とログイン中のユーザーの Cookie を使い、RLS が適用されます。Secret key はこの用途に使いません。

テーブル変更後の再生成コマンド：

```bash
npx supabase gen types typescript --linked --schema public > src/lib/supabase/database.types.ts
```
