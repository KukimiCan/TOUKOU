import type { GeneratedQuestion } from "../question-schema";

// 板書解説の mock と同じ、微分の講義を題材にした確認問題。
export const mockQuestion: GeneratedQuestion = {
  prompt: "微分係数の定義では、平均変化率をどのように扱いますか？",
  choices: [
    "入力の変化量を 1 に固定した平均変化率を使う",
    "入力の変化量を 0 に近づけたときの平均変化率の極限を求める",
    "入力の変化量を 0 にして、そのまま割り算する",
    "入力の変化量を大きくしたときの平均変化率を使う",
  ],
  answerIndex: 1,
  explanation:
    "平均変化率は2点間での変化の割合です。入力の変化量を 0 ではない値から 0 に近づけ、その極限を取ると、ある1点での瞬間の変化率を求められます。",
};
