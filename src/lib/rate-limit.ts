import { createHash } from "node:crypto";
// Stores only hashed identifiers, request fingerprints, references and statuses. Never booking PII.
type Entry = {
  fingerprint: string;
  reference: string;
  status: "pending" | "sent";
  expires: number;
};
const localRequests = new Map<string, Entry>();
const localLimits = new Map<string, { count: number; expires: number }>();
const ttl = 24 * 60 * 60;
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
function redisEnabled() {
  const url = process.env.UPSTASH_REDIS_REST_URL,
    token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!!url !== !!token) throw new Error("PROTECTION_CONFIGURATION");
  return !!(url && token);
}
export async function redis(command: (string | number)[]) {
  const response = await fetch(process.env.UPSTASH_REDIS_REST_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) throw new Error("PROTECTION_UNAVAILABLE");
  const body = (await response.json()) as { result: unknown; error?: string };
  if (body.error) throw new Error("PROTECTION_UNAVAILABLE");
  return body.result;
}
export async function allowRequest(ip: string) {
  const key = `clenix:rate:${digest(ip)}:${Math.floor(Date.now() / 600_000)}`;
  if (redisEnabled()) {
    const result = await redis([
      "EVAL",
      "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],600) end; return n",
      1,
      key,
    ]);
    return Number(result) <= 5;
  }
  // Best effort per process only. Configure Redis for durable Vercel protection.
  for (const [k, v] of localLimits)
    if (v.expires < Date.now()) localLimits.delete(k);
  const entry = localLimits.get(key) ?? {
    count: 0,
    expires: Date.now() + 600_000,
  };
  entry.count++;
  localLimits.set(key, entry);
  return entry.count <= 5;
}
export async function claimRequest(
  id: string,
  fingerprint: string,
  reference: string,
): Promise<{
  kind: "new" | "sent" | "pending" | "conflict";
  reference: string;
}> {
  const key = `clenix:request:${digest(id)}`;
  const entry: Entry = {
    fingerprint,
    reference,
    status: "pending",
    expires: Date.now() + ttl * 1000,
  };
  let existing: Entry | undefined;
  if (redisEnabled()) {
    const claimed = await redis([
      "SET",
      key,
      JSON.stringify(entry),
      "NX",
      "EX",
      ttl,
    ]);
    if (claimed === "OK") return { kind: "new", reference };
    const value = await redis(["GET", key]);
    if (typeof value !== "string") throw new Error("PROTECTION_UNAVAILABLE");
    existing = JSON.parse(value) as Entry;
  } else {
    for (const [k, v] of localRequests)
      if (v.expires < Date.now()) localRequests.delete(k);
    existing = localRequests.get(key);
    if (!existing) {
      localRequests.set(key, entry);
      return { kind: "new", reference };
    }
  }
  return {
    kind: existing.fingerprint !== fingerprint ? "conflict" : existing.status,
    reference: existing.reference,
  };
}
export async function markSent(
  id: string,
  fingerprint: string,
  reference: string,
) {
  const key = `clenix:request:${digest(id)}`;
  const entry: Entry = {
    fingerprint,
    reference,
    status: "sent",
    expires: Date.now() + ttl * 1000,
  };
  if (redisEnabled())
    await redis(["SET", key, JSON.stringify(entry), "EX", ttl]);
  else localRequests.set(key, entry);
}

// Release only after Telegram explicitly returned ok:false (definitely not accepted).
export async function releaseRejected(id: string) {
  const key = `clenix:request:${digest(id)}`;
  if (redisEnabled()) await redis(["DEL", key]);
  else localRequests.delete(key);
}
