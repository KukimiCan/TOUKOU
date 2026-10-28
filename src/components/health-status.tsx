// front 担当のファイル。
// UI 部品は src/components/ に置く。データは API（/api/...）から取得し、形は src/contracts/ の型を使う。
"use client";

import { useEffect, useState } from "react";

import { healthResponseSchema, type HealthResponse } from "@/contracts/health";

export function HealthStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.json())
      .then((json) => setHealth(healthResponseSchema.parse(json)))
      .catch(() => setError(true));
  }, []);

  if (error) return <p>/api/health に接続できませんでした。</p>;
  if (!health) return <p>接続を確認しています…</p>;

  return (
    <ul className="space-y-1 text-sm">
      <li>
        Supabase:{" "}
        {health.supabase.reachable
          ? "OK"
          : health.supabase.configured
            ? "接続できません（URL とキーを確認）"
            : "未設定（.env.local）"}
      </li>
      <li>
        AI（{health.ai.provider}）:{" "}
        {health.ai.configured ? "OK" : "キーが未設定"}
      </li>
    </ul>
  );
}
