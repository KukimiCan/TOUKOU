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

// GET の結果は、ログアウトするまで（変更があるまで）覚えておく（#210）。
// 覚えた結果はすぐに返し、前に取ってから少し経っていれば、裏で取り直して次の表示に使う。
// 覚える場所はメモリ（タブを閉じれば消える）。講義資料を端末に残さないため、localStorage や cookie には置かない
const REVALIDATE_MS = 5_000;

type Cached = { status: number; contentType: string | null; body: string };

// URL ごとに、取り終わった（または取っている途中の）結果を覚える。
// 取っている途中のものも覚えるので、同じ URL を同時に呼んでも通信は 1 本になる
const getCache = new Map<string, { at: number; result: Promise<Cached> }>();

// 何かを変えた（POST・PATCH・DELETE。ログインとログアウトも含む）ら、覚えたものは古くなるので全部捨てる
function clearCache() {
  getCache.clear();
}

async function send(
  url: string,
  method: NonNullable<Options["method"]>,
  body: unknown,
) {
  let res: Response;
  try {
    res = await fetch(url, { method, ...toRequestBody(body) });
  } catch {
    throw new ApiError(0, messageFor(0));
  }

  if (!res.ok) throw new ApiError(res.status, messageFor(res.status));
  return res;
}

async function readForCache(url: string): Promise<Cached> {
  const res = await send(url, "GET", undefined);
  return {
    status: res.status,
    contentType: res.headers.get("Content-Type"),
    body: await res.text(),
  };
}

// 取りに行き、取れたら覚えている結果と入れ替える。失敗したら、前に覚えていた結果を残す
function load(url: string) {
  const previous = getCache.get(url);
  const result = readForCache(url);
  const entry = { at: Date.now(), result };
  if (previous) {
    // 取り直しの最中に、同じ取り直しを重ねて始めないよう、前の結果の時刻も進めておく
    previous.at = entry.at;
  } else {
    getCache.set(url, entry);
  }
  result.then(
    () => {
      if (getCache.get(url) === (previous ?? entry)) getCache.set(url, entry);
    },
    () => {
      if (getCache.get(url) === entry) getCache.delete(url);
    },
  );
  return previous ?? entry;
}

// 先に取っておく。ログイン後に、各タブで使うデータをまとめて取り、初めて開くタブもすぐ表示する
export function prefetchApi(urls: readonly string[]) {
  for (const url of urls) {
    if (!getCache.has(url)) load(url);
  }
}

// API を呼び、成功したら Response を返す。失敗したら ApiError を投げる。
// GET は結果を覚え、同じ URL ならすぐその結果を返す（失敗した結果は覚えない）
export async function fetchApi(
  url: string,
  { method = "GET", body }: Options = {},
): Promise<Response> {
  if (method !== "GET") {
    clearCache();
    try {
      return await send(url, method, body);
    } finally {
      // 送っている間に取った GET の結果も、変更の前の古いものなので捨てる
      clearCache();
    }
  }

  const entry = getCache.get(url) ?? load(url);
  if (Date.now() - entry.at > REVALIDATE_MS) {
    // 古い結果を見せたまま、裏で取り直す。取れたら次から新しい方を使う
    entry.at = Date.now();
    void entry.result.then(() => load(url)).catch(() => {});
  }

  const cached = await entry.result;
  // Response の中身は 1 回しか読めないので、呼ぶたびに作り直して渡す
  return new Response(cached.body, {
    status: cached.status,
    headers: cached.contentType ? { "Content-Type": cached.contentType } : {},
  });
}

// 失敗の理由を、画面に出す文にする（ApiError 以外は、受け取ったデータの形が違ったときなど）
export function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : messageFor(500);
}
