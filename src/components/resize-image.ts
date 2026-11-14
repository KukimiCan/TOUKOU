// front 担当のファイル。
// 送る前に、写真をブラウザの中で縮小して JPEG にし直す（#66）。ライブラリは使わず、ブラウザの canvas（絵を描く機能）を使う。
// - スマホの写真は 4 MB（アップロードの上限）を超えやすいので、長い辺を MAX_SIDE に収める
// - JPEG に描き直すと、写真に入っている撮影場所などの情報（Exif）も消える
import { MATERIAL_IMAGE_MAX_BYTES } from "@/contracts/materials";

// 板書の小さな文字が読める大きさを残す
const MAX_SIDE = 2000;
const JPEG_QUALITY = 0.85;

// 画像を準備できなかった理由。画面で見出しを出し分ける
// - format：読み込めない形式（HEIC など）
// - size：縮小しても上限を超えた
// - other：それ以外（ブラウザの不調など）
export type ImageErrorKind = "format" | "size" | "other";

export class ImageError extends Error {
  readonly kind: ImageErrorKind;

  constructor(kind: ImageErrorKind, message: string) {
    super(message);
    this.name = "ImageError";
    this.kind = kind;
  }
}

// 画像ファイルを読み込む（読み込めない形式のときは ImageError）
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new ImageError(
          "format",
          "JPEG・PNG・WebP の画像を選んでください。iPhone の HEIC の写真は、読み込めないことがあります。",
        ),
      );
    };
    image.src = url;
  });
}

// 形式（file.type）は先に確かめない。HEIC などは file.type が空のことがあり、
// 「画像を選んでください」と出ると原因が分かりにくいため。読み込めなければ loadImage が形式を案内する
export async function resizeImage(file: File): Promise<File> {
  const image = await loadImage(file);
  const scale = Math.min(
    1,
    MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight),
  );
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context)
    throw new ImageError("other", "もう一度、画像を選んでください。");
  // 透明な部分（PNG）が黒くならないよう、先に白で塗る
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) throw new ImageError("other", "もう一度、画像を選んでください。");
  if (blob.size > MATERIAL_IMAGE_MAX_BYTES) {
    throw new ImageError(
      "size",
      `縮小しても ${MATERIAL_IMAGE_MAX_BYTES / 1024 / 1024} MB を超えました。別の写真を選んでください。`,
    );
  }

  const name = file.name.replace(/\.[^.]*$/, "") || "board";
  return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
}
