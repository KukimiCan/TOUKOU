// front 担当のファイル。
// 送る前に、写真をブラウザの中で縮小して JPEG にし直す（#66）。ライブラリは使わず、ブラウザの canvas（絵を描く機能）を使う。
// - スマホの写真は 4 MB（アップロードの上限）を超えやすいので、長い辺を MAX_SIDE に収める
// - JPEG に描き直すと、写真に入っている撮影場所などの情報（Exif）も消える
import { MATERIAL_IMAGE_MAX_BYTES } from "@/contracts/materials";

// 板書の小さな文字が読める大きさを残す
const MAX_SIDE = 2000;
const JPEG_QUALITY = 0.85;

export class ImageError extends Error {}

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
          "この画像は読み込めませんでした。JPEG・PNG・WebP の画像を選んでください。",
        ),
      );
    };
    image.src = url;
  });
}

export async function resizeImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new ImageError("画像のファイルを選んでください。");
  }

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
  if (!context) throw new ImageError("画像を準備できませんでした。");
  // 透明な部分（PNG）が黒くならないよう、先に白で塗る
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) throw new ImageError("画像を準備できませんでした。");
  if (blob.size > MATERIAL_IMAGE_MAX_BYTES) {
    throw new ImageError(
      "画像が大きすぎます。もう少し小さい画像を選んでください。",
    );
  }

  const name = file.name.replace(/\.[^.]*$/, "") || "board";
  return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
}
