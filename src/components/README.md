# src/components（front 担当）

画面の部品を置きます。ファイル名は `kebab-case.tsx`（例：`next-class-card.tsx`）。

- ブラウザで動く部品（ボタンを押す、入力する）は先頭に `"use client";` を書く
- データは API から取得し、形は `src/contracts/` の型を使う
- 見本：`health-status.tsx`
