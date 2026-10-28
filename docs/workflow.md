# 作業の進め方

TOUKOU は **issue ベース**で開発します。1 つの作業 = 1 つの issue = 1 つのブランチ = 1 つの PR です。

```
① issue を選ぶ → ② ブランチを作る → ③ AI エージェントと作る → ④ 動作確認
→ ⑤ commit → ⑥ push → ⑦ PR を作る → ⑧ レビュー → ⑨ merge → ⑩ main を最新にする
```

言葉が分からないときは [glossary.md](glossary.md) を見てください。

## ① issue を選ぶ

1. https://github.com/KukimiCan/TOUKOU/issues を開く
2. 自分の役割のラベル（`role:front` など）で絞り込む。はじめてなら `good first issue` から選ぶ
3. 誰も担当していない issue を開き、右側の **Assignees** で自分を選ぶ（「これは私がやります」の印）

やりたい作業の issue が無いときは、**New issue → タスク** から作ります。完了条件（何ができたら終わりか）を必ず書いてください。

## ② ブランチを作る

ブランチは「main を壊さずに作業するための、自分専用のコピー」です。**main で直接作業しないでください。**

```bash
git switch main
git pull
git switch -c front/12-home-screen
```

ブランチ名は `<役割>/<issue番号>-<短い英語の説明>` にします。

| 役割        | 例                        |
| ----------- | ------------------------- |
| front       | `front/12-home-screen`    |
| back        | `back/15-next-class-api`  |
| AI          | `ai/18-board-explanation` |
| DB+security | `db/10-timetable-tables`  |

## ③ AI エージェントと作る

TOUKOU のフォルダで AI エージェントを起動し、issue の内容を渡します。最初の頼み方の例です。

```
issue #12 を担当します。私の役割は front です。
https://github.com/KukimiCan/TOUKOU/issues/12
AGENTS.md と docs/roles/front.md を読んでから、
まず「何をどの順番で作るか」を短く説明してください。私が OK したら実装してください。
```

うまく進めるコツ：

- **まず計画を説明させる。** いきなり大量のコードを書かせない
- **小さく頼む。** 「ホーム画面を全部作って」より「次の授業カードだけ作って」
- **分からない言葉はその場で聞く。** 「今の説明の `props` って何？」と聞いてよい
- **エラーはそのまま貼る。** 「このエラーが出た。原因と直し方を教えて」
- **担当外のファイルを変えようとしたら止める。** 「それは back の担当なので、変えずに issue に書く内容を考えて」
- AI の説明が正しいとは限らない。画面で動きを確かめる

## ④ 動作確認

```bash
npm run dev
```

ブラウザで変更した画面や API を開き、issue の完了条件を満たしているか確かめます。
その後、形式チェックをします。

```bash
npm run format
npm run check
```

`npm run check` でエラーが出たら、エラーを AI エージェントに貼って直してもらいます。

## ⑤ commit（変更を記録する）

```bash
git status
git add .
git commit -m "feat: 次の授業カードを追加 (#12)"
```

- `git status` で、変えたファイルが自分の担当フォルダだけか確認する。**`.env.local` が出ていたら絶対に add しない**
- メッセージの頭には種類を付ける：`feat`（機能追加）、`fix`（バグ修正）、`docs`（ドキュメント）、`refactor`（整理）、`chore`（設定など）
- 最後に `(#issue番号)` を付ける
- 作業の区切りごとに何回 commit してもよい

## ⑥ push（GitHub に送る）

```bash
git push -u origin HEAD
```

## ⑦ PR を作る

```bash
gh pr create --web
```

ブラウザが開くので、テンプレートに沿って書きます。

- 本文に `Closes #12` と書く（merge すると issue が自動で閉じる）
- 何を変えたか、どう確認したか、画面ならスクリーンショット
- 他の役割に影響する変更（`src/contracts/` など）なら、その担当者を **Reviewers** に入れる

PR を作ると、GitHub が自動でチェック（CI）を動かします。PR の下のほうに ✅ が付けば OK、❌ なら「Details」からエラーを見て直し、もう一度 commit と push をします（PR は自動で更新されます）。

## ⑧ レビュー

- 誰か 1 人に承認（Approve）してもらうと merge できます
- コメントをもらったら直して push し、コメントに「直しました」と返信する
- **他の人の PR も見てください。** 分からなくても「この画面を開いたらこう表示された」と確認するだけで立派なレビューです

## ⑨ merge

承認されて CI が ✅ なら、PR の **Squash and merge** を押します。merge した後、ブランチを削除するボタンも押してください。

## ⑩ main を最新にする

```bash
git switch main
git pull
```

次の issue は ① からです。

## 困ったとき

### 作業中に main が更新された / PR に「conflicts」と出た

```bash
git switch main
git pull
git switch front/12-home-screen
git merge main
```

`CONFLICT` と出たら、同じ場所を 2 人が変えています。AI エージェントに「git merge main でコンフリクトが出た。両方の変更を残して解決して」と頼み、解決したら `npm run check` → commit → push します。
他の役割のファイルでコンフリクトしたら、その担当者に相談してください。

### 間違えて main で作業してしまった（まだ commit していない）

```bash
git switch -c front/12-home-screen
```

変更はそのまま新しいブランチに移ります。

### 何をしたか分からなくなった

`git status` と `git log --oneline -5` の結果を AI エージェントに見せて、「今どういう状態か、どうすれば元に戻せるか」を聞いてください。
**`git reset --hard` や `git push --force` は、意味が分かるまで使わないでください。**変更が消えます。

## 役割をまたぐ作業

- 他の役割のフォルダを変える必要があるときは、自分で直さずに issue を立てて担当者に頼む（ラベルで役割を付ける）
- 待っている issue があるときは、自分の issue に `blocked` ラベルを付け、本文に「#15 待ち」と書く
- 待つ間は `src/mocks/` の仮データで先に進める（[architecture.md](architecture.md)）
