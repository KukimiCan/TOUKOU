// back 担当のファイル。
// 時間割の設定の取得（GET）と変更（PATCH）。ログインしていなければ 401。
// 確認用: curl http://localhost:3000/api/settings
import { connection } from "next/server";

import { settingsSchema, updateSettingsSchema } from "@/contracts/settings";
import { getUserId } from "@/features/auth/get-user-id";
import {
  getSettings,
  updateSettings,
} from "@/features/settings/settings-store";

function unauthorized() {
  return Response.json({ error: "ログインしてください" }, { status: 401 });
}

export async function GET() {
  await connection();

  const userId = await getUserId();
  if (!userId) return unauthorized();

  return Response.json(settingsSchema.parse(await getSettings(userId)));
}

export async function PATCH(request: Request) {
  await connection();

  const userId = await getUserId();
  if (!userId) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = updateSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "入力が正しくありません", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  return Response.json(
    settingsSchema.parse(await updateSettings(userId, parsed.data)),
  );
}
