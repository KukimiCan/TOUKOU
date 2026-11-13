// front 担当のファイル。
// 画面から API（/api/...）を呼ぶための小さな道具。
// - 送る中身（body）は JSON にして送る。画像などのファイルを送るとき（FormData）は、そのまま送る
// - 失敗したとき（通信できない、ログインしていない、など）は ApiError を投げる。
//   message は「次にどうすればよいか」の日本語。画面では「保存できませんでした。」などの後ろに続けて出す
// - 受け取ったデータの形のチェックは、呼ぶ側で contracts の zod スキーマを使って行う

export class ApiError extends Error {
  // HTTP のステータスコード（401 = ログインしていない、404 = 見つからない、など）。通信できなかったときは 0
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function messageFor(status: number) {
  switch (status) {
    case 0:
      return "インターネットにつながっているか確かめて、もう一度試してください。";
    case 401:
      return "ログインが切れているかもしれません。ログインし直してください。";
    case 404:
      return "データが見つかりません。画面を読み込み直してください。";
    case 400:
      return "入力の内容を確かめてください。";
    default:
      return "少し時間をおいて、もう一度試してください。";
  }
}

type Options = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  // 送るデータ（JSON にして送る。FormData はそのまま送る）
  body?: unknown;
};

// 送る中身と、その形式を伝えるヘッダーを作る。
// FormData のときは、ブラウザが形式（multipart/form-data）と区切りの文字を自分で付けるので、ヘッダーは付けない
function toRequestBody(body: unknown) {
  if (body === undefined) return {};
  if (body instanceof FormData) return { body };
  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

// API を呼び、成功したら Response を返す。失敗したら ApiError を投げる
export async function fetchApi(
  url: string,
  { method = "GET", body }: Options = {},
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, { method, ...toRequestBody(body) });
  } catch {
    throw new ApiError(0, messageFor(0));
  }

  if (!res.ok) throw new ApiError(res.status, messageFor(res.status));
  return res;
}

// 失敗の理由を、画面に出す文にする（ApiError 以外は、受け取ったデータの形が違ったときなど）
export function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : messageFor(500);
}
