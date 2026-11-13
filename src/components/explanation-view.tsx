// front 担当のファイル。
// AI が作った板書の解説（要約、用語、数式、省略された説明、読めなかった箇所）を表示する（#68）。
// 解説の形は src/lib/ai/explanation-schema.ts（contracts の materials.ts からも使われている）。
// 数式は LaTeX（数式の書き方）の文字のまま出す。きれいな数式で出すにはライブラリが要るので、別に相談する。
import type { MaterialDetailResponse } from "@/contracts/materials";

// 画面は contracts だけを見る決まりなので、解説の型は contracts の詳細の型から取り出す
export type Explanation = NonNullable<MaterialDetailResponse["explanation"]>;

export function ExplanationView({ explanation }: { explanation: Explanation }) {
  const { summary, terms, formulas, omissions, unreadable } = explanation;

  return (
    <div className="flex flex-col gap-6">
      <Section title="要約">
        <p className="leading-relaxed">{summary}</p>
      </Section>

      {terms.length > 0 && (
        <Section title="用語">
          <dl className="flex flex-col gap-3">
            {terms.map((t, i) => (
              <div key={i}>
                <dt className="font-semibold">{t.term}</dt>
                <dd className="text-sm leading-relaxed opacity-80">
                  {t.meaning}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {formulas.length > 0 && (
        <Section title="数式">
          <ul className="flex flex-col gap-4">
            {formulas.map((f, i) => (
              <li key={i} className="flex flex-col gap-1">
                {/* 長い数式は横にスクロールして見る */}
                <code className="overflow-x-auto rounded bg-current/5 px-3 py-2 font-mono text-sm whitespace-pre">
                  {f.formula}
                </code>
                <p className="text-sm leading-relaxed opacity-80">
                  {f.explanation}
                </p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {omissions.length > 0 && (
        <Section title="板書で省略されていること">
          <dl className="flex flex-col gap-3">
            {omissions.map((o, i) => (
              <div key={i}>
                <dt className="font-semibold">{o.topic}</dt>
                <dd className="text-sm leading-relaxed opacity-80">
                  {o.explanation}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}

      {unreadable.length > 0 && (
        <Section title="読み取れなかったところ">
          <p className="text-sm opacity-70">元の画像で確かめてください。</p>
          <ul className="list-disc pl-5 text-sm leading-relaxed">
            {unreadable.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </section>
  );
}
