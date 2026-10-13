import { afterEach, it, expect, vi } from "vitest";
import {
  allowRequest,
  claimRequest,
  markSent,
  releaseRejected,
} from "../src/lib/rate-limit";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
it("allows one concurrent claim and returns the original sent reference", async () => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  const id = crypto.randomUUID();
  const claims = await Promise.all([
    claimRequest(id, "same", "REF1"),
    claimRequest(id, "same", "REF2"),
  ]);
  expect(claims.map((c) => c.kind)).toEqual(["new", "pending"]);
  await markSent(id, "same", "REF1");
  expect(await claimRequest(id, "same", "REF3")).toEqual({
    kind: "sent",
    reference: "REF1",
  });
  expect((await claimRequest(id, "different", "REF4")).kind).toBe("conflict");
});
it("only releases rejected requests for retry", async () => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  const id = crypto.randomUUID();
  await claimRequest(id, "same", "REF");
  await releaseRejected(id);
  expect((await claimRequest(id, "same", "RETRY")).kind).toBe("new");
});
it("limits the sixth request in a local ten-minute window", async () => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  const ip = crypto.randomUUID();
  for (let i = 0; i < 5; i++) expect(await allowRequest(ip)).toBe(true);
  expect(await allowRequest(ip)).toBe(false);
});
it("uses Redis atomic operations without transmitting plain IPs", async () => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.test");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "secret");
  const fetcher = vi.fn(async () => Response.json({ result: 1 }));
  vi.stubGlobal("fetch", fetcher);
  expect(await allowRequest("192.0.2.1")).toBe(true);
  const call = fetcher.mock.calls[0] as unknown as [string, RequestInit];
  expect(String(call[1].body)).toContain("EVAL");
  expect(String(call[1].body)).not.toContain("192.0.2.1");
});
it("fails closed on a Redis outage or partial configuration", async () => {
  vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.test");
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  await expect(allowRequest("ip")).rejects.toThrow();
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "secret");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("", { status: 503 })),
  );
  await expect(allowRequest("ip")).rejects.toThrow();
});
