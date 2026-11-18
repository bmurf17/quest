export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

export type ImageUploadDirectory = "items" | "equipment";

export interface ImageUploadTarget {
  /** Which folder under `public/images` receives the file. */
  directory: ImageUploadDirectory;
}

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/") || !ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Choose a PNG, JPG, WebP, GIF, or SVG image.";
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return "Images must be 5 MB or smaller.";
  }
  return null;
}

/**
 * Send an image to the local Vite endpoint, which writes it into
 * `public/images/<directory>` and returns the public path to store on the row.
 */
export async function uploadImage(file: File, target: ImageUploadTarget): Promise<string> {
  const problem = validateImageFile(file);
  if (problem) throw new Error(problem);

  let response: Response;
  try {
    response = await fetch("/__admin/upload-image", {
      method: "POST",
      headers: {
        "Content-Type": file.type,
        "X-File-Name": encodeURIComponent(file.name),
        "X-Image-Directory": target.directory,
      },
      body: file,
    });
  } catch {
    throw new Error("Could not reach the local upload endpoint. Run the admin through `pnpm dev`.");
  }

  const payload = (await response.json().catch(() => null)) as {
    path?: string;
    error?: string;
  } | null;

  if (!response.ok || !payload?.path) {
    throw new Error(payload?.error ?? "Could not save the image.");
  }

  return payload.path;
}
