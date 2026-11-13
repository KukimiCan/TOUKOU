// back 担当のファイル。
// ホーム画面の情報（次の授業、残り時間、移動開始時刻）を返す。ログインしていなければ 401。
// 確認用: curl http://localhost:3000/api/home
import { connection } from "next/server";

import { homeResponseSchema } from "@/contracts/home";
import { getUserId } from "@/features/auth/get-user-id";
import { getHome } from "@/features/home/get-home";

export async function GET() {
  // 今の時刻で結果が変わるので、ビルド時に固定しない
  await connection();

  const userId = await getUserId();
  if (!userId) {
    return Response.json({ error: "ログインしてください" }, { status: 401 });
  }

  return Response.json(
    homeResponseSchema.parse(await getHome(userId, new Date())),
  );
}
