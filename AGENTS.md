<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TOUKOU：AI エージェント向けの指示

TOUKOU は、大学生向けの AI 学習・時間管理アプリです。4 つの役割（front / back / AI / DB+security）のチームで、issue ベースで開発しています。
**メンバーにはプログラミング未経験の人もいます。** 説明は日本語で、専門用語には短い説明を添えてください。

## 作業を始める前に読むもの

1. `docs/spec.md`：仕様（何を作るか）。仕様に無い機能を勝手に追加しない
2. `docs/architecture.md`：フォルダ構成と役割ごとの持ち場
3. `docs/roles/<役割>.md`：その役割の書き方の決まり
4. `docs/workflow.md`：issue → ブランチ → PR の進め方

ユーザーの役割が分からないときは、作業の前に聞いてください。

## 守るルール

- **ユーザーの役割の持ち場だけを変更する。** 他の役割のフォルダ（`docs/architecture.md` の表）を変える必要があれば、変更せずに「担当者に頼む issue の文面」を提案する
- `src/contracts/`、`src/mocks/`、`package.json`、`docs/` は共有ファイル。変更するときは、誰に影響するかをユーザーに伝える
- **1 issue = 1 ブランチ = 1 PR。** main で直接作業しない。ブランチ名は `<役割>/<issue番号>-<説明>`（`front` / `back` / `ai` / `db`）
- **実装の前に、何をどの順番で作るかを短く説明し、ユーザーの了承をもらう**
- 変更は小さく保つ。issue の完了条件を満たしたら止まる
- **秘密情報を commit しない。** `.env.local` を add しない。API キーをコード、issue、PR に書かない
- ライブラリを追加するときは、理由をユーザーに説明してから追加する
- commit メッセージは `<種類>: <日本語の説明> (#issue番号)`。種類は `feat` / `fix` / `docs` / `refactor` / `chore`
- 作業を終える前に `npm run format` と `npm run check` を実行し、エラーが無いことを確認する
- `git reset --hard`、`git push --force`、ブランチの削除など、変更が消える操作はユーザーに確認してから行う

## 設計のルール

- 画面は API を `fetch` で呼ぶ。画面から DB や AI を直接呼ばない
- API（`src/app/api/**/route.ts`）は薄くし、処理は `src/features/` に書く
- API の入出力は `src/contracts/` の zod スキーマで定義し、front と back で同じ型を使う
- AI の呼び出しは `src/lib/ai/` にまとめる。`AI_PROVIDER=mock` のときは AI を呼ばずに仮の結果を返す
- DB は `src/lib/supabase/` のクライアントを使う。すべてのテーブルで RLS を有効にする
- 講義資料・板書は非公開が基本。共有するのは、本人が確認して公開した問題文と解説だけ
- AI が作った解説や問題には、元の資料を開ける導線を付ける
- 見本は `/api/health`（`docs/architecture.md` の「確認用の見本」）

## コマンド

| コマンド         | 内容                                  |
| ---------------- | ------------------------------------- |
| `npm run dev`    | 開発用に起動（http://localhost:3000） |
| `npm run check`  | lint + 型チェック + 書式チェック      |
| `npm run format` | 書式を整える                          |
| `npm run build`  | ビルド                                |
