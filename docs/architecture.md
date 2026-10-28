# フォルダ構成と役割分担

TOUKOU は 4 つの役割で並行して作ります。

| 役割        | ラベル             | 一言でいうと                                      |
| ----------- | ------------------ | ------------------------------------------------- |
| front       | `role:front`       | 画面を作る                                        |
| back        | `role:back`        | API と計算（次の授業、空きコマなど）を作る        |
| AI          | `role:ai`          | AI に解説・要約・問題を作らせる関数を作る         |
| DB+security | `role:db-security` | テーブル、ログイン、データの公開範囲（RLS）を作る |

**自分の役割のフォルダだけを触る。** これを守ると、4 人が同時に作業してもコンフリクト（同じファイルの取り合い）が起きにくくなります。

## フォルダと持ち場

```
TOUKOU/
├─ src/
│  ├─ app/                    画面と API の入口（Next.js のルール：フォルダ名 = URL）
│  │  ├─ page.tsx             front  ホーム画面（/）
│  │  ├─ <画面名>/page.tsx    front  各画面（/timetable など）
│  │  ├─ layout.tsx           front  全画面に共通の枠
│  │  └─ api/<名前>/route.ts  back   API（/api/<名前>）
│  ├─ components/             front  画面の部品（ボタン、カードなど）
│  ├─ contracts/              共有   API の入出力の形（zod）。front と back の約束
│  ├─ features/<機能名>/      back   計算や処理の本体（API から呼ばれる）
│  ├─ lib/
│  │  ├─ ai/                  AI     AI の呼び出し、プロンプト、mock
│  │  └─ supabase/            DB     Supabase に接続するクライアント、DB の型
│  └─ mocks/                  共有   仮データ（API や AI ができる前に画面を作るため）
├─ supabase/
│  ├─ migrations/             DB     テーブルと RLS の定義（SQL）
│  └─ config.toml             DB     Supabase CLI の設定
├─ public/                    front  画像などの静的ファイル
├─ docs/                      全員   ドキュメント
└─ .github/                   全員   issue / PR のテンプレート、CI
```

各フォルダの中にも `README.md` があり、そのフォルダに何を置くかが書いてあります。

## データの流れ

```
[ブラウザ]                         [サーバー（Next.js）]                      [外部]
画面（front）
  │ fetch("/api/...")
  └──────────────▶ API（back: src/app/api）
                      │ 入力を contracts の zod でチェック
                      └──▶ 処理の本体（back: src/features）
                              ├──▶ AI の関数（AI: src/lib/ai） ──────▶ OpenAI / Gemini
                              └──▶ Supabase クライアント（DB: src/lib/supabase） ─▶ Supabase
```

- front は API を `fetch` で呼ぶだけ。DB や AI を直接呼ばない
- back の API（`route.ts`）は薄くして、処理の本体は `src/features/` に書く
- AI の関数は「入力（画像や文字）→ 結果（型の決まったデータ）」だけを担当し、DB に保存しない。保存は back が行う
- DB+security は、テーブルと RLS で「誰が何を読み書きできるか」を保証する

## 他の役割を待たずに作業する方法

| 状況                             | どうするか                                                                       |
| -------------------------------- | -------------------------------------------------------------------------------- |
| front：API がまだ無い            | `src/mocks/` の仮データで画面を作る。API ができたら `fetch` に差し替える         |
| back：AI の関数がまだ無い        | `AI_PROVIDER=mock` で、仮の結果を返す関数を使う                                  |
| back：テーブルがまだ無い         | 先に `src/contracts/` で入出力を決め、`src/mocks/` のデータを返す API にしておく |
| AI：アプリに組み込む前に試したい | `src/lib/ai/` の関数を単体で作る。mock の結果も一緒に作る                        |

## 共有ファイルのルール

`src/contracts/`、`src/mocks/`、`package.json`、`docs/` は全員に関係します。

- 変更するときは、PR の説明に「何を変えたか、誰に影響するか」を書く
- `src/contracts/` を変えるときは、front と back の両方にレビューを頼む
- `package.json` にライブラリを追加するときは、PR で理由を書く
- 他の役割のフォルダを変える必要が出たら、自分で直さずに issue を立てて担当者に頼む

## 確認用の見本

`/api/health` が、4 つの持ち場を一通り通る見本になっています。新しい機能を作るときは、これを真似してください。

| 持ち場       | ファイル                                               |
| ------------ | ------------------------------------------------------ |
| contracts    | `src/contracts/health.ts`                              |
| back（API）  | `src/app/api/health/route.ts`                          |
| back（本体） | `src/features/health/check-health.ts`                  |
| AI           | `src/lib/ai/index.ts`                                  |
| DB           | `src/lib/supabase/env.ts`                              |
| front        | `src/components/health-status.tsx`、`src/app/page.tsx` |
