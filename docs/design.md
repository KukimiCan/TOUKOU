# デザインの決まり（front）

TOUKOU の画面の見た目と動きの決まりです。新しい画面を作るとき、既存の画面を直すときは、ここに合わせてください。

## 方針

- シンプルで、上質に見えること。要素を詰め込まず、余白と細い罫線で区切る
- 全体は明るい。紙のような背景に、墨色の文字、琥珀色のアクセント
- 利用者が待たされていると感じないこと。押したらすぐ反応し、待つときは何が起きているかを見せる
- スマホが主な利用場面。幅 390px で崩れないこと

## 色（`src/app/globals.css` の変数を使う）

| 用途       | クラス                                         | 使いどころ               |
| ---------- | ---------------------------------------------- | ------------------------ |
| 背景       | `bg-background`                                | 画面全体                 |
| 面         | `bg-surface`                                   | 入力欄、少し浮かせたい面 |
| 文字       | `text-foreground`                              | 本文、見出し             |
| 補助の文字 | `text-muted`                                   | 説明、日時、補足         |
| 罫線       | `border-line`                                  | 区切り、枠               |
| アクセント | `text-accent` / `bg-accent` / `bg-accent-soft` | 強調、現在地、進み具合   |
| 失敗       | `text-danger` / `bg-danger/10`                 | エラー、削除             |
| 成功       | `text-success` / `bg-success/10`               | 正解、保存できた         |

- `text-red-600`、`bg-emerald-600`、`bg-black`、`text-white` など、Tailwind の生の色は使わない
- `opacity-70` で文字を薄くしない。`text-muted` を使う
- `border-current/20` などの「文字色を薄めた枠」は使わない。`border-line` を使う
- `dark:` は使わない（画面は常に明るい）

## 形

- 角丸は `rounded-sm`（2px）まで。`rounded-lg`、`rounded-2xl`、`rounded-full`（丸いバッジやアイコンの背景を除く）は使わない
- 影は付けない。区切りは罫線と余白で
- カードを機械的に並べない。情報のまとまりごとに、見出しと罫線で区切る

## 文字

- 本文と見出し：Zen Kaku Gothic New（`font-sans`、既定）
- ラベル・数字・英字：Barlow Condensed（`font-display`）。数字は `tabular-nums`
- 数式・コード・URL：等幅の書体（`font-mono`）
- 見出しは画面の主役を食わない大きさにする（ページの見出しは `text-2xl` まで）
- 単語や文節の途中で改行させない。日本語の段落には `[word-break:auto-phrase]` を付ける。ボタンやラベルは `whitespace-nowrap`

## アイコン

- `lucide-react` を使う。太さは既定（1.75〜2）、大きさは文字に合わせて `size-4`（本文）、`size-5`（ナビ）
- 意味を補う場所だけに使う（操作のボタン、状態、空の表示）。飾りとして並べない
- アイコンだけのボタンには `aria-label` を付ける。アイコンには `aria-hidden` を付ける

## 部品

- ボタン：`src/components/ui/button.tsx` の `Button` を使う
  - `primary`：画面で一番大事な操作（1 画面に 1 つが目安）
  - `secondary`：その次の操作
  - `ghost`：目立たせない操作
  - `danger`：削除など
  - 処理中は `loading` を渡す（回る印が出て、二度押しできなくなる）
- 画面を移動するボタン：`src/components/ui/button-link.tsx` の `ButtonLink` を使う（リンクなので、移動先が先読みされて速く開く）
- `<label>` などをボタンの見た目にしたいとき：`button.tsx` の `buttonClass(variant)` を使う。同じクラスを手で書かない
- 文中のリンク：スマホではリンクに 44px の最小の高さが付くので、`inline-flex items-center` を付けて行の高さを崩さない
- 読み込み中の印：`src/components/ui/spinner.tsx` の `Spinner`
- 画面の読み込み：各画面の `loading.tsx` が `PageSkeleton` を出す。画面の中の部分的な読み込みは、形の近い骨格（`.skeleton`）を出す

## 待ち時間と反応

- 押したら、すぐ見た目を変える（`loading`、押した状態の色）
- 1 秒を超えそうな処理（AI の生成など）は、何をしているかを文で出す（例：「板書を読み取っています」）。可能なら段階を出す
- 失敗したときは、何が起きたかと、次にどうすればよいかを書き、やり直しのボタンを出す
- 空のときは、空であることと、最初にやることへの導線を出す（アイコン＋短い文＋ボタン）

## 動き

- 動きは短く（150〜250ms）、控えめに。`transition-colors`、`transition-opacity` を基本にする
- 完了したとき（保存、正解など）だけ、少し目立つ動きを入れてよい
- `prefers-reduced-motion` のときは、動きを止める（`globals.css` で設定済み）

## スマホ

- 押す場所は 44px 以上（`globals.css` で、ボタンとリンクに最小の高さを設定済み）
- 入力欄の文字は 16px（iPhone の画面拡大を防ぐ。設定済み）
- 下のナビ（56px）と重ならないよう、画面の最後に余白がある（設定済み）
- 横に長い表は、横スクロールにするか、縦に並べ替える
