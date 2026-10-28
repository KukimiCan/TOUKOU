# TOUKOU（逃講）

> **授業はスキップしても、学びはスキップしない。**

大学生向けの AI 学習・時間管理アプリです。時間割から次の授業の場所と移動の目安を出し、板書や講義資料を AI が解説・問題にして、空きコマの復習や友達との問題共有につなげます。

## はじめての人へ：読む順番

| 順番 | 文書                                               | 内容                                                                                                                                              |
| ---- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | [docs/spec.md](docs/spec.md)                       | 何を作るか（仕様書）                                                                                                                              |
| 2    | [docs/getting-started.md](docs/getting-started.md) | 自分のパソコンで動かすまで（環境構築）                                                                                                            |
| 3    | [docs/workflow.md](docs/workflow.md)               | issue を選んでから merge するまで（作業の進め方）                                                                                                 |
| 4    | [docs/architecture.md](docs/architecture.md)       | フォルダ構成と役割分担                                                                                                                            |
| 5    | `docs/roles/`                                      | 自分の役割の説明（[front](docs/roles/front.md) / [back](docs/roles/back.md) / [AI](docs/roles/ai.md) / [DB+security](docs/roles/db-security.md)） |

困ったら [docs/glossary.md](docs/glossary.md)（用語集）と [docs/api.md](docs/api.md)（API 一覧）も見てください。

## すぐ動かす（環境構築が済んでいる人向け）

```bash
npm install
cp .env.example .env.local   # 値を入れる。AI_PROVIDER=mock ならキー無しでも動く
npm run dev                  # http://localhost:3000
```

## よく使うコマンド

| コマンド         | 内容                                                          |
| ---------------- | ------------------------------------------------------------- |
| `npm run dev`    | 開発用に起動する                                              |
| `npm run check`  | lint、型チェック、書式チェックをまとめて行う（PR の前に必ず） |
| `npm run format` | 書式を自動で整える                                            |
| `npm run build`  | 本番用にビルドする                                            |

## 技術構成

Next.js（App Router、TypeScript）/ Tailwind CSS / Supabase（DB、Auth、Storage）/ Vercel AI SDK（OpenAI または Google Gemini）/ zod
