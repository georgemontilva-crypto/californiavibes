/**
 * What may be uploaded, and as what.
 *
 * Shared by the presigned-URL endpoint and the through-the-server fallback so
 * the two can't drift: a type accepted by one and refused by the other would
 * only show up when the first path happens to fail.
 */
export const UPLOAD_KINDS = [
  "lab-report",
  "product-image",
  "video",
  "video-poster",
] as const;

export type UploadKind = (typeof UPLOAD_KINDS)[number];

export function isUploadKind(value: string): value is UploadKind {
  return (UPLOAD_KINDS as readonly string[]).includes(value);
}

const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

/** Returns a sentence describing what is wrong, or null when the type is fine. */
export function uploadTypeProblem(
  kind: UploadKind,
  mimeType: string
): string | null {
  if (kind === "lab-report") {
    return mimeType === "application/pdf"
      ? null
      : "Lab reports must be PDF files";
  }
  if (kind === "video") {
    return VIDEO_TYPES.includes(mimeType)
      ? null
      : "Videos must be MP4, MOV or WebM files";
  }
  return mimeType.startsWith("image/") ? null : "This must be an image file";
}
