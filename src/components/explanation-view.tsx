// front 担当のファイル。
// AI が作った板書の解説（要約、用語、数式、省略された説明、読めなかった箇所）を表示する（#68）。
// 解説の形は src/lib/ai/explanation-schema.ts（contracts の materials.ts からも使われている）。
// - まとまりごとに、見出しと細い罫線で区切る。要約は主役なので少し大きく出す
// - 読み取れなかったところは最後に置き、3 件以上あるときは折りたたんで、主役の解説を邪魔しない
// 数式は LaTeX（数式の書き方）の文字のまま出す。きれいな数式で出すにはライブラリが要るので、別に相談する。
import { ChevronDown, EyeOff } from "lucide-react";

import type { MaterialDetailResponse } from "@/contracts/materials";

// 画面は contracts だけを見る決まりなので、解説の型は contracts の詳細の型から取り出す
export type Explanation = NonNullable<MaterialDetailResponse["explanation"]>;

// 読み取れなかったところが、この件数を超えたら最初は閉じておく
const UNREADABLE_OPEN_MAX = 2;

export function ExplanationView({ explanation }: { explanation: Explanation }) {
  const { summary, terms, formulas, omissions, unreadable } = explanation;

  return (
    <div className="flex flex-col">
      <Section title="要約" first>
        <p className="leading-relaxed [word-break:auto-phrase]">{summary}</p>
      </Section>

      {terms.length > 0 && (
        <Section title="用語" count={terms.length}>
          <dl className="flex flex-col gap-4">
            {terms.map((t, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <dt className="font-semibold">{t.term}</dt>
                <dd className="text-sm leading-relaxed [word-break:auto-phrase]">
                  {t.meaning}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {formulas.length > 0 && (
        <Section title="数式" count={formulas.length}>
          <ul className="flex flex-col gap-5">
            {formulas.map((f, i) => (
              <li key={i} className="flex flex-col gap-1.5">
                {/* 長い数式は横にスクロールして見る。数式は 1 文字ずつ読むので、幅のそろった書体にする */}
                <code className="border-line bg-surface overflow-x-auto rounded-sm border px-3 py-2 font-[ui-monospace,SFMono-Regular,Menlo,Consolas,monospace] text-sm whitespace-pre">
                  {f.formula}
                </code>
                <p className="text-sm leading-relaxed [word-break:auto-phrase]">
                  {f.explanation}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {omissions.length > 0 && (
        <Section title="板書で省略されていること" count={omissions.length}>
          <dl className="flex flex-col gap-4">
            {omissions.map((o, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <dt className="font-semibold [word-break:auto-phrase]">
                  {o.topic}
                </dt>
                <dd className="text-sm leading-relaxed [word-break:auto-phrase]">
                  {o.explanation}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {unreadable.length > 0 && (
        <details
          open={unreadable.length <= UNREADABLE_OPEN_MAX}
          className="group border-line border-t py-4"
        >
          <summary className="text-muted hover:text-foreground flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm transition-colors [&::-webkit-details-marker]:hidden">
            <EyeOff aria-hidden className="size-4 shrink-0" />
            <span className="font-semibold">読み取れなかったところ</span>
            <span className="font-display tabular-nums">
              {unreadable.length} 件
            </span>
            <ChevronDown
              aria-hidden
              className="ml-auto size-4 shrink-0 transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="text-muted flex flex-col gap-2 pt-1 text-sm">
            <p className="[word-break:auto-phrase]">
              <a
                href="#original"
                className="text-foreground font-semibold underline underline-offset-4"
              >
                元の画像
              </a>
              で確かめてください。
            </p>
            <ul className="list-disc pl-5 leading-relaxed">
              {unreadable.map((u, i) => (
                <li key={i} className="[word-break:auto-phrase]">
                  {u}
                </li>
              ))}
            </ul>
          </div>
        </details>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  first = false,
  children,
}: {
  title: string;
  // 項目の数（要約のように 1 つだけのものは出さない）
  count?: number;
  // 最初のまとまりは、上の罫線を引かない
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`flex flex-col gap-3 py-5 ${first ? "pt-0" : "border-line border-t"}`}
    >
      <h3 className="flex items-baseline gap-2 text-base">
        {title}
        {count !== undefined && (
          <span className="font-display text-muted text-sm font-normal tabular-nums">
            {count}
          </span>
        )}
      </h3>
      {children}
    </section>
  );
}
