import type { Explanation } from "../explanation-schema";

/**
 * AI_PROVIDER=mock のときに返す板書解説の仮データ（見本）
 * 大学生の講義（微分積分の基礎）を想定したリアルな解説内容
 */
export const mockExplanation: Explanation = {
  summary:
    "この講義板書では、微分の基本定義である導関数の導出と、平均変化率から瞬間変化率への極限操作について解説しています。",
  terms: [
    {
      term: "平均変化率",
      meaning:
        "ある区間において、入力 x の変化量に対する出力 y の変化量の割合（直線の傾き）。",
    },
    {
      term: "極限 (limit)",
      meaning: "変数がある値に限りなく近づくときの、関数が目指す値。",
    },
    {
      term: "導関数",
      meaning: "関数の各点における接線の傾き（瞬間変化率）を与える新しい関数。",
    },
  ],
  formulas: [
    {
      formula: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}",
      explanation:
        "導関数の定義式。微小区間 h を 0 に限りなく近づけたときの平均変化率の極限として、x における瞬間の変化率を定義しています。",
    },
    {
      formula: "\\frac{\\Delta y}{\\Delta x} = \\frac{f(x+h) - f(x)}{h}",
      explanation:
        "2点 (x, f(x)) と (x+h, f(x+h)) を結ぶ割線の傾き（平均変化率）を表します。",
    },
  ],
  omissions: [
    {
      topic: "h が 0 に近づく際の割り算",
      explanation:
        "板書では省略されていますが、h は 0 そのものではなく「0 に限りなく近い値」であるため、分母が 0 にならずに極限を考えることができます。",
    },
    {
      topic: "関数の連続性と微分可能性",
      explanation:
        "微分ができるためには、前提として関数が途切れずにつながっている（連続である）必要があります。",
    },
  ],
  unreadable: [],
};
