// front 担当のファイル。
// 資料一覧の画面の見出し。画面（page.tsx）と読み込み中（loading.tsx）で同じものを出し、読み込み後に位置がずれないようにする。
export function MaterialsHeader() {
  return (
    <header>
      <p className="font-display text-muted text-xs tracking-[0.2em] uppercase">
        Materials
      </p>
      <h1 className="mt-1 text-2xl">資料</h1>
      <p className="text-muted mt-2 text-sm [word-break:auto-phrase]">
        板書を撮ると、AI が解説と確認問題を作ります。
      </p>
    </header>
  );
}
