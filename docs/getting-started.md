# 環境構築（はじめての人向け）

プログラミングをしたことがなくても、この手順を上から順にやれば TOUKOU を自分のパソコンで動かせます。
所要時間は 30〜60 分くらいです。詰まったら最後の「困ったとき」を見て、それでもだめならチームに聞いてください。

> **ターミナル**とは、文字でパソコンに命令する画面です。
>
> - Windows：スタートメニューで「PowerShell」を検索して開く（Git を入れた後は「Git Bash」でも可）
> - Mac：「ターミナル」アプリを開く（Launchpad →その他→ターミナル）
>
> この文書で `このような枠` に書いてあるコマンドは、ターミナルに貼り付けて Enter で実行します。

## 1. GitHub アカウントを作る

1. https://github.com/signup でアカウントを作る
2. 作ったユーザー名をチームに伝え、TOUKOU のリポジトリに招待してもらう
3. 届いた招待メール（または https://github.com/notifications ）から招待を承認する

## 2. 必要なソフトを入れる

### Git（コードの変更履歴を管理する道具）

- Windows：https://git-scm.com/download/win からインストーラーを入れる（設定はすべて初期値のまま「Next」で OK）
- Mac：ターミナルで `git --version` を実行する。入っていなければインストールの案内が出るので、それに従う

### Node.js（TOUKOU を動かすための土台）

https://nodejs.org/ から **LTS** と書いてある版（24 系）を入れます。

### GitHub CLI（GitHub にログインするための道具）

- Windows：https://cli.github.com/ からインストーラーを入れる
- Mac：https://cli.github.com/ の手順に従う（Homebrew があれば `brew install gh`）

### エディタ（コードを読み書きするアプリ）

Visual Studio Code（VS Code）をおすすめします：https://code.visualstudio.com/
TOUKOU を開くと「おすすめの拡張機能を入れますか？」と聞かれるので、「インストール」を選んでください（ESLint、Prettier、Tailwind CSS）。

### 入ったか確認する

ソフトを入れた後は、**ターミナルを一度閉じて開き直して**から、次を実行します。

```bash
git --version
node --version
npm --version
gh --version
```

4 つとも数字（バージョン）が表示されれば OK です。`node --version` は `v24` などで始まれば OK です（`v22` 以上なら動きます）。

## 3. Git と GitHub の初期設定（最初の 1 回だけ）

```bash
git config --global user.name "GitHubのユーザー名"
git config --global user.email "GitHubに登録したメールアドレス"
gh auth login
```

`gh auth login` では、矢印キーと Enter で次を選びます。

1. `GitHub.com`
2. `HTTPS`
3. `Authenticate Git with your GitHub credentials?` → `Yes`
4. `Login with a web browser` → 表示されたコードをブラウザに入力して承認

## 4. TOUKOU を手元に持ってくる（clone）

作業用のフォルダに移動してから clone します。

```bash
cd ~/Desktop
gh repo clone KukimiCan/TOUKOU
cd TOUKOU
```

## 5. 必要なライブラリを入れる

```bash
npm install
```

数分かかります。最後に `found 0 vulnerabilities` などが出れば OK です（`warn` は気にしなくて大丈夫）。

## 6. 環境変数（秘密の設定）を用意する

```bash
cp .env.example .env.local
```

VS Code で `.env.local` を開き、チームから受け取った値を `=` の後ろに入れます。

- **まだ値をもらっていなくても大丈夫です。** `AI_PROVIDER=mock` のままなら、AI のキーが無くても動きます
- `.env.local` は Git に入らない設定になっています。**この中身を GitHub、issue、PR、公開のチャットに貼らないでください**

## 7. 起動する

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます。「開発環境の状態」が表示されれば成功です。

| 表示             | 意味                                                                        |
| ---------------- | --------------------------------------------------------------------------- |
| Supabase: OK     | Supabase に接続できている                                                   |
| Supabase: 未設定 | `.env.local` に Supabase の値がまだ無い（front の作業はこのままでもできる） |
| AI（mock）: OK   | AI は仮の結果を返すモードで動いている                                       |

止めるときは、ターミナルで `Ctrl + C` を押します。

## 8. AI エージェントを使えるようにする

TOUKOU は AI エージェントと一緒に開発する前提です。どれを使ってもかまいません。

| AI エージェント           | 読む設定ファイル                             |
| ------------------------- | -------------------------------------------- |
| Claude Code               | `CLAUDE.md`（中身は `AGENTS.md` を読み込む） |
| Codex                     | `AGENTS.md`                                  |
| Antigravity               | `AGENTS.md`                                  |
| GitHub Copilot（VS Code） | `AGENTS.md`                                  |

各ツールの公式サイトの手順で入れて、**TOUKOU のフォルダを開いた状態で**起動してください。
AI エージェントは `AGENTS.md` を読んで、TOUKOU のルール（自分の担当フォルダだけを触る、など）に従って作業します。

使い方は [workflow.md](workflow.md) を見てください。
Antigravity と無料の Gemini で始める人は、[はじめての AI 担当ガイド](guides/ai-beginner-antigravity.md) に、準備から最初の提出まで一歩ずつ書いてあります。

## 9. 最後の確認

```bash
npm run check
```

エラーが出なければ、環境構築は完了です。次は [workflow.md](workflow.md) を読んで、最初の issue に取り組みましょう。

## 困ったとき

| 症状                                                     | 対処                                                                                                                   |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `command not found` / `'xxx' は認識されていません`       | ソフトが入っていないか、ターミナルを開き直していない。ターミナルを閉じて開き直す。だめならパソコンを再起動する         |
| `npm install` でエラー                                   | `node --version` が v22 以上か確認する。古ければ Node.js の LTS を入れ直す                                             |
| `Port 3000 is in use`                                    | 別のターミナルで `npm run dev` が動いている。そちらを `Ctrl + C` で止める                                              |
| `Permission denied` / `Repository not found`（clone 時） | リポジトリへの招待を承認していないか、`gh auth login` をしていない                                                     |
| Supabase が「接続できません」                            | `.env.local` の URL とキーに余計な空白や引用符が無いか確認する。直したら `npm run dev` を再起動する                    |
| 何が起きているか分からない                               | エラーの文章をそのまま AI エージェントに貼って「何が起きているか、どう直せばいいか教えて」と聞く。秘密のキーは貼らない |
