# src/lib/ai（AI 担当）

AI（OpenAI / Google Gemini）を呼ぶ関数を置きます。詳しくは `docs/roles/ai.md`。

- `index.ts`：どの AI を使うかの切り替え（`AI_PROVIDER`）
- `<機能名>.ts`：生成する関数（例：`explain-board.ts`）
- `prompts/`：プロンプト
- `mocks/`：`AI_PROVIDER=mock` のときに返す仮の結果
