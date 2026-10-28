// back 担当のファイル。
// Route Handler は「入力を確認する → features の関数を呼ぶ → JSON を返す」だけにする。
// 開発環境の確認用: http://localhost:3000/api/health
import { connection } from "next/server";

import { checkHealth } from "@/features/health/check-health";

export async function GET() {
  // ビルド時に結果を固定せず、アクセスのたびに確認する。
  await connection();
  return Response.json(await checkHealth());
}
