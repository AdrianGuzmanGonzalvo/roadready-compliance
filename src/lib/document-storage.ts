import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

/**
 * Driver documents live as plain files under DOCUMENTS_DIR, at the same
 * relative path that DriverDocument.pathname holds
 * ("<tenantCode>/drivers/<driverId>/<file>"). In production that directory is
 * a Docker volume (see docker-compose.yml); it holds PII and is never served
 * directly — only through the authenticated file route.
 *
 * The `turbopackIgnore` comments in this file matter: these paths are only
 * known at runtime, and without them the build traces the whole project
 * folder (source, .env, everything) into the standalone output.
 */
const DOCUMENTS_DIR = path.resolve(/* turbopackIgnore: true */ process.env.DOCUMENTS_DIR ?? "./storage/documents");

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

const ALLOWED_CONTENT_TYPES = new Set(Object.values(CONTENT_TYPE_BY_EXTENSION));

/**
 * The content type a document is stored and served as: what the browser
 * reported if it is an allowed type, otherwise whatever the file extension
 * says (browsers report nothing for .heic on some platforms). Null means the
 * file is not an allowed kind of document.
 */
export function documentContentType(filename: string, reported?: string | null): string | null {
  const type = reported?.split(";")[0].trim().toLowerCase();
  if (type && ALLOWED_CONTENT_TYPES.has(type)) return type;
  const extension = filename.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPE_BY_EXTENSION[extension] ?? null;
}

/** Strips anything that could change the directory a file lands in, and keeps the name within filesystem limits. */
export function safeDocumentFilename(filename: string): string {
  const cleaned = filename
    .replace(/[/\\\u0000-\u001f]/g, "_")
    .replace(/^\.+/, "")
    .trim();
  return (cleaned || "document").slice(-150);
}

/** Absolute path for a stored pathname, or null if it would escape DOCUMENTS_DIR. */
function resolveDocumentPath(pathname: string): string | null {
  const resolved = path.resolve(/* turbopackIgnore: true */ DOCUMENTS_DIR, pathname);
  if (!resolved.startsWith(DOCUMENTS_DIR + path.sep)) return null;
  return resolved;
}

export class DocumentTooLargeError extends Error {
  constructor() {
    super("File is too large");
  }
}

/**
 * Writes a document to disk and returns its size in bytes. Written to a
 * temporary name first, so a failed or oversized upload never leaves a
 * half-written file at the real pathname.
 */
export async function saveDocument(
  pathname: string,
  body: ReadableStream<Uint8Array>,
  maxBytes: number = MAX_DOCUMENT_BYTES
): Promise<number> {
  const target = resolveDocumentPath(pathname);
  if (!target) throw new Error("Invalid document path");

  await mkdir(/* turbopackIgnore: true */ path.dirname(target), { recursive: true });
  const partial = `${target}.partial`;
  let size = 0;
  const limit = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      size += chunk.length;
      callback(size > maxBytes ? new DocumentTooLargeError() : null, chunk);
    },
  });

  try {
    await pipeline(
      Readable.fromWeb(body as import("node:stream/web").ReadableStream),
      limit,
      createWriteStream(/* turbopackIgnore: true */ partial)
    );
    await rename(/* turbopackIgnore: true */ partial, target);
  } catch (error) {
    await rm(/* turbopackIgnore: true */ partial, { force: true });
    throw error;
  }
  return size;
}

/** Size in bytes of a stored document, or null if it is not on disk. */
export async function documentSize(pathname: string): Promise<number | null> {
  const target = resolveDocumentPath(pathname);
  if (!target) return null;
  const info = await stat(/* turbopackIgnore: true */ target).catch(() => null);
  return info?.isFile() ? info.size : null;
}

/** Opens a stored document for reading, or returns null if it is not on disk. */
export async function openDocument(pathname: string): Promise<{ stream: ReadableStream<Uint8Array>; size: number } | null> {
  const size = await documentSize(pathname);
  if (size === null) return null;
  const target = resolveDocumentPath(pathname) as string;
  const stream = Readable.toWeb(createReadStream(/* turbopackIgnore: true */ target));
  return { stream: stream as ReadableStream<Uint8Array>, size };
}

export async function deleteDocument(pathname: string): Promise<void> {
  const target = resolveDocumentPath(pathname);
  if (target) await rm(/* turbopackIgnore: true */ target, { force: true });
}
