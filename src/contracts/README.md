# src/contracts（共有：front と back の約束）

API の入出力の形を [zod](https://zod.dev) で定義します。front も back もここの型を使います。

- 1 つの API（または機能）に 1 ファイル。例：`courses.ts`
- 変更するときは、front と back の両方にレビューを頼む
- 見本：`health.ts`
