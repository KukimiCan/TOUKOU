// front 担当のファイル。
// AI のキーの登録画面（#220）。板書の解説と確認問題は、各ユーザーが登録した自分のキーで作る。
// - 開いたら GET /api/settings/ai-key で、登録済みかと末尾 4 文字を読む（キーそのものは返ってこない）
// - 登録（POST）はサーバーがキーを試してから保存する。使えないキーはここでメッセージを出す
// - 登録済みなら、末尾 4 文字と「変更」「削除」だけを出す
"use client";

import {
  CircleCheck,
  ExternalLink,
  KeyRound,
  RotateCw,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useId, useState } from "react";

import {
  type AiKeyStatus,
  aiKeyStatusSchema,
  saveAiKeySchema,
} from "@/contracts/ai-key";

import { FormError, inputClass } from "./course-form";
import { ApiError, errorMessage, fetchApi } from "./fetch-api";
import { Button } from "./ui/button";
import { Screen } from "./ui/screen";

const KEY_PAGE_URL = "https://aistudio.google.com/apikey";

type Load =
  | { status: "loading" }
  | { status: "error"; error: unknown }
  | { status: "ready"; key: AiKeyStatus };

async function loadStatus() {
  const res = await fetchApi("/api/settings/ai-key");
  return aiKeyStatusSchema.parse(await res.json());
}

// 登録できなかった理由。400 はサーバーがキーを試して断ったとき
function saveErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 400) {
    return "このキーは使えませんでした。最後までコピーできているか確かめてください。";
  }
  if (error instanceof ApiError && error.status === 502) {
    return "キーを確かめられませんでした。少し時間をおいて、もう一度試してください。";
  }
  return `登録できませんでした。${errorMessage(error)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

export function AiKeySettings() {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    loadStatus()
      .then((key) => {
        if (!ignore) setLoad({ status: "ready", key });
      })
      .catch((error: unknown) => {
        if (!ignore) setLoad({ status: "error", error });
      });
    return () => {
      ignore = true;
    };
  }, [attempt]);

  return (
    <Screen label="SETTINGS" title="AI のキー">
      {load.status === "loading" && (
        <div role="status" aria-live="polite" className="flex flex-col gap-3">
          <span className="sr-only">読み込み中です</span>
          <div className="skeleton h-5 w-56" />
          <div className="skeleton h-11 w-full" />
        </div>
      )}
      {load.status === "error" && (
        <div className="flex flex-col items-start gap-3">
          <p role="alert" className="text-danger flex items-center gap-2">
            <TriangleAlert aria-hidden className="size-4 shrink-0" />
            読み込めませんでした
          </p>
          <p className="text-muted text-sm [word-break:auto-phrase]">
            {errorMessage(load.error)}
          </p>
          <Button
            variant="secondary"
            icon={<RotateCw aria-hidden className="size-4" />}
            onClick={() => {
              setLoad({ status: "loading" });
              setAttempt((n) => n + 1);
            }}
          >
            もう一度読み込む
          </Button>
        </div>
      )}
      {load.status === "ready" && (
        <KeyPanel
          status={load.key}
          onChange={(key) => setLoad({ status: "ready", key })}
        />
      )}
    </Screen>
  );
}

function KeyPanel({
  status,
  onChange,
}: {
  status: AiKeyStatus;
  onChange: (key: AiKeyStatus) => void;
}) {
  // 登録済みのときは、「変更」を押すまで入力欄を出さない
  const [editing, setEditing] = useState(!status.registered);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!status.required) {
    return (
      <p className="text-muted text-sm [word-break:auto-phrase]">
        開発用の設定（AI_PROVIDER=mock）で動いているので、キーは要りません。
      </p>
    );
  }

  async function onDelete() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetchApi("/api/settings/ai-key", { method: "DELETE" });
      const next = aiKeyStatusSchema.parse(await res.json());
      setEditing(true);
      onChange(next);
    } catch (e) {
      setError(`削除できませんでした。${errorMessage(e)}`);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {status.registered && !editing ? (
        <section className="border-line flex flex-col gap-4 border-y py-4">
          <div className="flex items-center gap-3">
            <CircleCheck aria-hidden className="text-success size-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">登録済み</p>
              <p className="text-muted text-sm tabular-nums">
                <span className="font-mono">••••{status.hint}</span>
                {status.updatedAt && (
                  <span className="ml-2 whitespace-nowrap">
                    {formatDate(status.updatedAt)} に登録
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={<KeyRound aria-hidden className="size-4" />}
              onClick={() => {
                setError(null);
                setEditing(true);
              }}
            >
              変更
            </Button>
            <Button
              variant="ghost"
              loading={deleting}
              icon={<Trash2 aria-hidden className="size-4" />}
              onClick={onDelete}
            >
              削除
            </Button>
          </div>
        </section>
      ) : (
        <KeyForm
          canCancel={status.registered}
          onCancel={() => setEditing(false)}
          onSaved={(next) => {
            setEditing(false);
            onChange(next);
          }}
        />
      )}
      {error && <FormError>{error}</FormError>}
      <Notes provider={status.provider} />
    </div>
  );
}

function KeyForm({
  canCancel,
  onCancel,
  onSaved,
}: {
  canCancel: boolean;
  onCancel: () => void;
  onSaved: (key: AiKeyStatus) => void;
}) {
  const id = useId();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = saveAiKeySchema.safeParse({ apiKey: value });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "キーを確かめてください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetchApi("/api/settings/ai-key", {
        method: "POST",
        body: parsed.data,
      });
      onSaved(aiKeyStatusSchema.parse(await res.json()));
    } catch (e) {
      setError(saveErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      <ol className="text-muted flex list-decimal flex-col gap-1 pl-5 text-sm [word-break:auto-phrase]">
        <li>
          <a
            href={KEY_PAGE_URL}
            target="_blank"
            rel="noreferrer"
            className="text-foreground inline-flex items-center gap-1 font-semibold underline underline-offset-2"
          >
            Google AI Studio
            <ExternalLink aria-hidden className="size-3.5" />
          </a>
          を開く
        </li>
        <li>Google アカウントでログインし、API キーを作ってコピーする</li>
        <li>下に貼って登録する</li>
      </ol>
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${id}-key`} className="text-sm font-semibold">
          API キー
        </label>
        <input
          id={`${id}-key`}
          type="password"
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="none"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={error ? true : undefined}
          className={`${inputClass} font-mono`}
        />
      </div>
      {error && <FormError>{error}</FormError>}
      <div className="flex gap-2">
        <Button
          type="submit"
          loading={saving}
          icon={<KeyRound aria-hidden className="size-4" />}
        >
          {saving ? "確かめています" : "登録する"}
        </Button>
        {canCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            やめる
          </Button>
        )}
      </div>
    </form>
  );
}

// 登録の前に知っておくこと（短く）
function Notes({ provider }: { provider: AiKeyStatus["provider"] }) {
  return (
    <ul className="text-muted flex flex-col gap-1.5 text-sm [word-break:auto-phrase]">
      <li>
        板書の解説と確認問題は、このキーで作ります。料金や回数の上限は、キーの持ち主のアカウントにかかります。
      </li>
      {provider === "google" && (
        <li>
          無料枠のキーでは、送った板書が Google
          のサービス改善に使われることがあります。
        </li>
      )}
      <li>
        キーは暗号化して保存し、画面には
        <span className="whitespace-nowrap">末尾 4 文字</span>だけを出します。
      </li>
    </ul>
  );
}
