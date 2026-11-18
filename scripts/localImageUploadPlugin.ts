import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

const UPLOAD_PATH = "/__admin/upload-image";
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const UPLOAD_DIRECTORIES = new Set(["items", "equipment"]);
const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

class UploadError extends Error {}

const headerValue = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? "") : (value ?? "");

function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let tooLarge = false;

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_UPLOAD_BYTES) {
        tooLarge = true;
        chunks.length = 0;
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (tooLarge) reject(new UploadError("Images must be 5 MB or smaller."));
      else resolve(Buffer.concat(chunks));
    });
    req.on("error", reject);
  });
}

function safeBaseName(rawName: string): string {
  let decoded = rawName;
  try {
    decoded = decodeURIComponent(rawName);
  } catch {
    // Keep the raw value when it is not valid percent-encoding.
  }

  const filename = decoded.split(/[\\/]/).pop() ?? "";
  const withoutExtension = filename.replace(/\.[^.]+$/, "");
  return (
    withoutExtension
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "image"
  );
}

async function availableFilename(directory: string, base: string, extension: string) {
  const existing = new Set(await readdir(directory).catch(() => []));
  let filename = `${base}${extension}`;
  let suffix = 2;
  while (existing.has(filename)) {
    filename = `${base}-${suffix}${extension}`;
    suffix += 1;
  }
  return filename;
}

async function handleUpload(req: IncomingMessage, res: ServerResponse) {
  const send = (status: number, payload: Record<string, unknown>) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(payload));
  };

  if (req.method !== "POST") {
    send(405, { error: "Use POST to upload an image." });
    return;
  }

  const directory = headerValue(req.headers["x-image-directory"]).toLowerCase() || "items";
  if (!UPLOAD_DIRECTORIES.has(directory)) {
    send(400, { error: "Images can only be uploaded to items or equipment." });
    return;
  }

  const contentType = headerValue(req.headers["content-type"]).split(";")[0].trim().toLowerCase();
  const extension = EXTENSION_BY_MIME[contentType];
  if (!extension) {
    send(415, { error: "Choose a PNG, JPG, WebP, GIF, or SVG image." });
    return;
  }

  const contentLength = Number(headerValue(req.headers["content-length"]));
  if (Number.isFinite(contentLength) && contentLength > MAX_UPLOAD_BYTES) {
    send(413, { error: "Images must be 5 MB or smaller." });
    return;
  }

  try {
    const body = await readBody(req);
    if (body.length === 0) {
      send(400, { error: "The uploaded file was empty." });
      return;
    }

    const destination = path.join(process.cwd(), "public", "images", directory);
    await mkdir(destination, { recursive: true });

    const base = safeBaseName(headerValue(req.headers["x-file-name"]));
    const filename = await availableFilename(destination, base, extension);
    await writeFile(path.join(destination, filename), body);

    send(200, {
      filename,
      path: `/images/${directory}/${filename}`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save the image.";
    send(err instanceof UploadError ? 400 : 500, { error: message });
  }
}

/**
 * Dev/preview-only endpoint that writes admin image uploads into
 * `public/images/<items|equipment>`. There is no database or Storage involved,
 * which keeps the local/solo admin workflow file-based.
 */
export function localImageUploadPlugin(): Plugin {
  return {
    name: "quest-local-image-upload",
    configureServer(server) {
      server.middlewares.use(UPLOAD_PATH, (req, res) => {
        void handleUpload(req, res);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(UPLOAD_PATH, (req, res) => {
        void handleUpload(req, res);
      });
    },
  };
}
