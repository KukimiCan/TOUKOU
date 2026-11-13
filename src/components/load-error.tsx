// front 担当のファイル。
// 画面を開いたときに API から読み込めなかったときの表示（資料一覧・資料詳細で使う）。
// - ログインしていない（401）：読み込み直しても同じなので、ログインへの案内を出す
// - それ以外（通信できない、サーバーの不調など）：理由と「もう一度読み込む」ボタンを出す
import Link from "next/link";

import { ApiError, errorMessage } from "./fetch-api";

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
        <p>{loginMessage}</p>
        <Link
          href="/login"
          className="bg-foreground text-background rounded px-6 py-3 font-semibold"
        >
          ログインする
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div role="alert" className="flex flex-col gap-1">
        <p className="font-semibold">{title}</p>
        <p className="text-sm opacity-70">{errorMessage(error)}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded border border-current/30 px-6 py-3 font-semibold"
      >
        もう一度読み込む
      </button>
    </div>
  );
}
