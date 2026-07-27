import {
  InvalidRequestBodyError,
  readJsonWithLimit,
  RequestBodyTooLargeError,
} from "./paid-ai-guard";

export class UnsafeRequestOriginError extends Error {}

export class UnsupportedRequestMediaTypeError extends Error {}

/**
 * Browser requests mutating cookie-backed state must originate from this app.
 * Origin is preferred; Sec-Fetch-Site is the fallback for clients that omit it.
 */
export function assertSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const expectedOrigin = new URL(request.url).origin;

  if (origin) {
    if (origin !== expectedOrigin) throw new UnsafeRequestOriginError();
  } else if (fetchSite !== "same-origin") {
    throw new UnsafeRequestOriginError();
  }

  if (fetchSite && fetchSite !== "same-origin") {
    throw new UnsafeRequestOriginError();
  }
}

export async function readSameOriginJsonWithLimit(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  assertSameOriginRequest(request);
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    throw new UnsupportedRequestMediaTypeError();
  }
  return readJsonWithLimit(request, maxBytes);
}

export function requestGuardStatus(error: unknown): number | null {
  if (error instanceof UnsafeRequestOriginError) return 403;
  if (error instanceof UnsupportedRequestMediaTypeError) return 415;
  if (error instanceof RequestBodyTooLargeError) return 413;
  if (error instanceof InvalidRequestBodyError) return 400;
  return null;
}

export function requestGuardMessage(error: unknown): string {
  if (error instanceof UnsafeRequestOriginError) return "Origem invalida";
  if (error instanceof UnsupportedRequestMediaTypeError) {
    return "Content-Type invalido";
  }
  if (error instanceof RequestBodyTooLargeError) {
    return "Payload excede o limite permitido";
  }
  return "JSON invalido";
}

export function isPlainRecord(
  value: unknown,
): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function isBoundedString(
  value: unknown,
  minLength: number,
  maxLength: number,
): value is string {
  return (
    typeof value === "string" &&
    value.length >= minLength &&
    value.length <= maxLength
  );
}
