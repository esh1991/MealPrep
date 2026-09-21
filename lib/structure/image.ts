// Shrinking a photo before it is sent. A phone camera file is several
// megabytes and mostly detail the reader cannot use; the long edge is
// capped so the upload stays quick and the token cost stays small.

const MAX_EDGE = 1600;
const QUALITY = 0.85;

export interface PreparedImage {
  mediaType: "image/jpeg";
  /** Base64 with no data-URL prefix, which is what the API wants. */
  data: string;
  /** For showing the picked photo back to the user. */
  previewUrl: string;
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith("image/")) throw new Error("That file is not an image.");

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("That photo couldn't be opened.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const previewUrl = canvas.toDataURL("image/jpeg", QUALITY);
  return { mediaType: "image/jpeg", data: previewUrl.split(",")[1] ?? "", previewUrl };
}
