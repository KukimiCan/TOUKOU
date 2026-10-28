# front 担当

画面を作る役割です。ユーザーが見て触るものすべてが担当です。

## 触るフォルダ

| フォルダ                            | 置くもの                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| `src/app/**/page.tsx`、`layout.tsx` | 画面（フォルダ名がそのまま URL になる。`src/app/timetable/page.tsx` → `/timetable`） |
| `src/components/`                   | 画面の部品                                                                           |
| `src/app/globals.css`               | 全体の色や文字の設定                                                                 |
| `public/`                           | 画像などのファイル                                                                   |
| `src/mocks/`                        | 画面を作るための仮データ（共有。追加は自由、変更は PR に書く）                       |

**触らないもの：** `src/app/api/`（back）、`src/features/`（back）、`src/lib/`（AI、DB）、`supabase/`（DB）

## 作る画面

[spec.md の 4 章](../spec.md#4-画面) を見てください。スマホで使う場面が多いので、**スマホの幅で見やすいこと**を優先します。

## 進め方

1. `src/contracts/` に、使う API の型があるか確認する
2. API がまだ無ければ、`src/mocks/` の仮データ（無ければ型に合わせて自分で作る）で画面を作る
3. API ができたら `fetch("/api/...")` に差し替える。受け取ったデータは contracts の zod でチェックする（見本：`src/components/health-status.tsx`）

## 知っておくとよいこと

- **Server Component と Client Component**：Next.js の部品は、何も書かなければサーバーで作られます。ボタンを押す、入力するなど、ブラウザで動く部品はファイルの先頭に `"use client";` を書きます
- **Tailwind CSS**：`className="text-lg font-bold"` のように、クラス名で見た目を決めます
- このリポジトリの Next.js は新しい版です。AI エージェントが古い書き方をしたら、`AGENTS.md` にある通り `node_modules/next/dist/docs/` を読ませてください

## 確認方法

- `npm run dev` → ブラウザの開発者ツール（F12）でスマホ表示に切り替えて確認する
- PR にはスクリーンショットを付ける

## AI エージェントへの頼み方の例

```
front 担当です。issue #12 をやります。
docs/spec.md の「ホーム」画面のうち、次の授業カードだけを作りたいです。
API はまだ無いので、src/contracts/ の型に合わせた仮データを src/mocks/ に作って使ってください。
スマホ幅で見やすくしてください。まず計画を説明してください。
```
