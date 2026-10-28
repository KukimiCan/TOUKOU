# AI 担当

AI（OpenAI / Google Gemini）に、解説・要約・確認問題などを作らせる関数を作る役割です。

## 触るフォルダ

| フォルダ                 | 置くもの                                                 |
| ------------------------ | -------------------------------------------------------- |
| `src/lib/ai/index.ts`    | どの AI を使うかの切り替え（`getModel()`、`isMockAi()`） |
| `src/lib/ai/<機能名>.ts` | 生成する関数（1 機能 1 ファイル）                        |
| `src/lib/ai/prompts/`    | プロンプト（AI への指示文）                              |
| `src/lib/ai/mocks/`      | `AI_PROVIDER=mock` のときに返す仮の結果                  |

**触らないもの：** 画面（front）、API と DB への保存（back）、テーブル（DB）

## 担当する主な関数（[spec.md](../spec.md)）

- 板書の画像 → 解説（数式、用語、省略された説明）
- 講義資料 → 前回のまとめ
- 板書・資料 → 確認問題と解説
- 空きコマ提案の文面（計算は back。AI は言葉にするだけでもよい）

## 書き方の決まり

- **入力と出力の型を決める**：出力は zod スキーマで定義し、AI SDK の `generateText` に `output: Output.object({ schema })` で渡す。決まった形の JSON で返ってくるので、back が扱いやすい
- **mock を必ず作る**：`isMockAi()` が true のときは AI を呼ばず、仮の結果を返す。キーが無い人や back・front の開発のため
- **DB に保存しない**：関数は「入力 → 結果」だけ。保存は back の担当
- **元の資料への導線**：結果に「どの資料から作ったか」を back が紐づけられるようにする（[spec.md 7 章](../spec.md#7-守ることプライバシーと-ai)）
- **キーは `.env.local` だけ**：コードに書かない。`process.env` から読む（`src/lib/ai/index.ts` がやっている）

関数の形の例（イメージ）：

```ts
import { generateText, Output } from "ai";
import { z } from "zod";

import { getModel, isMockAi } from "@/lib/ai";

export const explanationSchema = z.object({
  summary: z.string(),
  terms: z.array(z.object({ term: z.string(), meaning: z.string() })),
});

export async function explainBoard(image: Uint8Array) {
  if (isMockAi()) {
    return { summary: "（仮）板書の解説", terms: [] };
  }
  const { output } = await generateText({
    model: getModel(),
    output: Output.object({ schema: explanationSchema }),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "この板書を大学生向けに解説して" },
          { type: "file", mediaType: "image", data: image },
        ],
      },
    ],
  });
  return output;
}
```

AI SDK の正しい書き方は、`node_modules/ai/docs/` や https://ai-sdk.dev/docs を AI エージェントに読ませて確認してください。

## 最初にやること

- OpenAI と Gemini のどちらを使うか、どのモデルを使うか（**画像入力に対応したもの**）を決めて、チームに共有する
- `.env.local` の `AI_PROVIDER` と `AI_MODEL` を全員にそろえてもらう

## 確認方法

関数を呼ぶだけの確認用 API を一時的に作るか、AI エージェントに「この関数を試すスクリプトを作って」と頼みます。
確認用のファイルは PR に入れないか、入れるなら back と相談してください。

## AI エージェントへの頼み方の例

```
AI 担当です。issue #18 をやります。
板書の画像を受け取って、解説を返す関数を src/lib/ai/ に作りたいです。
docs/roles/ai.md の決まりに従って、出力の zod スキーマと mock も作ってください。
AI SDK の使い方は node_modules/ai/docs/ を読んで確認してください。まず計画を説明してください。
```
