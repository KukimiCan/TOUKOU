// front 担当のファイル。
// 画面を開いたときに API から読み込めなかったときの表示（ホーム・資料一覧・資料詳細・問題で使う）。
// - ログインしていない（401）：読み込み直しても同じなので、ログインへの案内を出す
// - それ以外（通信できない、サーバーの不調など）：何が起きたかと次にどうするか、「もう一度読み込む」ボタンを出す
// アイコン＋短い文＋ボタンの形にそろえる（docs/design.md「待ち時間と反応」）。
import { CircleAlert, LogIn, RotateCw } from "lucide-react";

import { ApiError, errorMessage } from "./fetch-api";
import { Button } from "./ui/button";
import { ButtonLink } from "./ui/button-link";

type Props = {
  error: unknown;
  // 例：「資料を読み込めませんでした」
  title: string;
  // ログインしていないときの案内。例：「ログインすると、資料を確認できます。」
  loginMessage: string;
  onRetry: () => void;
};

export function LoadError({ error, title, loginMessage, onRetry }: Props) {
  if (error instanceof ApiError && error.status === 401) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <span
          aria-hidden
          className="bg-accent-soft text-accent flex size-11 items-center justify-center rounded-full"
        >
          <LogIn className="size-5" />
        </span>
        <p className="max-w-sm [word-break:auto-phrase]">{loginMessage}</p>
        <ButtonLink
          href="/login"
          variant="primary"
          icon={<LogIn aria-hidden className="size-4" />}
        >
          ログインする
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <span
        aria-hidden
        className="bg-danger/10 text-danger flex size-11 items-center justify-center rounded-full"
      >
        <CircleAlert className="size-5" />
      </span>
      <div role="alert" className="flex max-w-sm flex-col gap-1">
        <p className="font-semibold [word-break:auto-phrase]">{title}</p>
        <p className="text-muted text-sm [word-break:auto-phrase]">
          {errorMessage(error)}
        </p>
      </div>
      <Button
        variant="secondary"
        icon={<RotateCw aria-hidden className="size-4" />}
        onClick={onRetry}
        className="whitespace-nowrap"
      >
        もう一度読み込む
      </Button>
    </div>
  );
}
