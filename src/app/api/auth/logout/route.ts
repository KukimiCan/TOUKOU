// DB+security 担当のファイル。
// ログアウト（POST）。セッションを終わらせ、cookie を消す。
import { connection } from "next/server";

import { logoutResponseSchema } from "@/contracts/auth";
import { createClient } from "@/lib/supabase/server";

const noStore = { "Cache-Control": "private, no-store" };

export async function POST() {
  await connection();

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return Response.json(
      { error: "ログアウトできませんでした" },
      { status: 500, headers: noStore },
    );
  }

  return Response.json(logoutResponseSchema.parse({ ok: true }), {
    headers: noStore,
  });
}
