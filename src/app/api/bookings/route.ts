import { randomUUID } from "node:crypto";
import { bookingSchema, istanbulToday } from "@/lib/booking-schema";
import {
  sendTelegram,
  telegramConfigured,
  TelegramRejection,
} from "@/lib/telegram";
import {
  allowRequest,
  claimRequest,
  digest,
  markSent,
  releaseRejected,
} from "@/lib/rate-limit";
export const runtime = "nodejs";
export const maxDuration = 30;
const MAX_BODY = 16_384;
const reply = (body: object, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
async function readBody(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY)
    throw new Error("TOO_LARGE");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("INVALID");
  const parts: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) {
      await reader.cancel();
      throw new Error("TOO_LARGE");
    }
    parts.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return JSON.parse(
    new TextDecoder("utf-8", { fatal: true }).decode(bytes),
  ) as unknown;
}
export async function POST(request: Request) {
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    return reply({ code: "CONTENT_TYPE" }, 415);
  const origin = request.headers.get("origin");
  if (
    origin &&
    origin !== new URL(request.url).origin &&
    origin !== process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  )
    return reply({ code: "ORIGIN" }, 403);
  let body: unknown;
  try {
    body = await readBody(request);
  } catch (e) {
    return reply(
      {
        code:
          e instanceof Error && e.message === "TOO_LARGE"
            ? "TOO_LARGE"
            : "INVALID",
      },
      e instanceof Error && e.message === "TOO_LARGE" ? 413 : 400,
    );
  }
  // Explicitly ignore browser monetary claims; reject other unexpected properties.
  if (body && typeof body === "object" && !Array.isArray(body)) {
    const copy = { ...body } as Record<string, unknown>;
    delete copy.total;
    delete copy.estimate;
    delete copy.price;
    body = copy;
  }
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success)
    return reply(
      {
        code: "VALIDATION",
        fields: [...new Set(parsed.error.issues.map((i) => String(i.path[0])))],
      },
      422,
    );
  if (!telegramConfigured()) return reply({ code: "CONFIGURATION" }, 503);
  const b = parsed.data;
  // Normalize inactive fields before fingerprinting or sending.
  if (b.service === "ac") delete b.area;
  if (b.contact !== "telegram") b.telegram = "";
  const fingerprint = digest(JSON.stringify(b));
  const reference = `CLX-${istanbulToday().replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`;
  try {
    const ip =
      request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() ||
      (process.env.NODE_ENV !== "production"
        ? "development"
        : request.headers.get("x-forwarded-for")?.split(",")[0].trim()) ||
      "unknown";
    if (!(await allowRequest(ip))) return reply({ code: "RATE_LIMIT" }, 429);
    const claim = await claimRequest(b.requestId, fingerprint, reference);
    if (claim.kind === "sent")
      return reply({ success: true, reference: claim.reference });
    if (claim.kind !== "new") return reply({ code: "PENDING" }, 409);
    try {
      await sendTelegram(b, reference);
    } catch (error) {
      // An explicit rejection is safe to retry; timeouts remain locked.
      if (error instanceof TelegramRejection) {
        await releaseRejected(b.requestId);
        return reply({ code: "DELIVERY" }, 502);
      }
      return reply({ code: "PENDING" }, 502);
    }
    // Once Telegram accepted the request, a failed cache write must not pretend the delivery failed.
    try {
      await markSent(b.requestId, fingerprint, reference);
    } catch {
      /* Pending lock remains; no PII logged. */
    }
    return reply({ success: true, reference });
  } catch {
    return reply({ code: "UNAVAILABLE" }, 503);
  }
}
