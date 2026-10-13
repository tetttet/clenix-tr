import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { fixture } from "./fixtures";
import { formatTelegram } from "../src/lib/telegram";
vi.mock("../src/lib/rate-limit", () => ({
  digest: (s: string) => s,
  allowRequest: vi.fn(async () => true),
  claimRequest: vi.fn(async (_id: string, _f: string, reference: string) => ({
    kind: "new",
    reference,
  })),
  markSent: vi.fn(async () => {}),
  releaseRejected: vi.fn(async () => {}),
}));
import { POST } from "../src/app/api/bookings/route";
import { allowRequest, claimRequest } from "../src/lib/rate-limit";
function request(body: unknown, headers: Record<string, string> = {}) {
  return new Request("https://clenix.test/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-only-token");
  vi.stubEnv("TELEGRAM_CHAT_ID", "-1001234567890");
  vi.stubEnv("TELEGRAM_MESSAGE_THREAD_ID", "");
  vi.mocked(allowRequest).mockResolvedValue(true);
  vi.mocked(claimRequest).mockImplementation(async (_id, _f, reference) => ({
    kind: "new",
    reference,
  }));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("Telegram and HTTP boundary", () => {
  it("escapes hostile content without treating it as markup", () => {
    const text = formatTelegram(
      fixture({ name: "<b>A & B</b>", notes: '<script>alert("x")</script>' }),
      "CLX-TEST",
    );
    expect(text).toContain("&lt;b&gt;A &amp; B&lt;/b&gt;");
    expect(text).not.toContain("<script>");
    expect(text).toContain("ИТОГО ОТ 5200 TRY");
    expect(text.length).toBeLessThan(4096);
  });
  it("keeps the Telegram template in Russian for every site locale", () => {
    for (const locale of ["en", "tr", "kk", "ru"] as const) {
      const text = formatTelegram(fixture({ locale }), "CLX-TEST");
      expect(text).toContain("НОВАЯ ЗАЯВКА НА УБОРКУ");
      expect(text).toContain("Услуга: Генеральная уборка");
      expect(text).toContain("Предпочтительный способ связи: Звонок");
      expect(text).toContain("ИТОГО ОТ 5200 TRY");
      expect(text).not.toContain("NEW CLEANING REQUEST");
    }
  });
  it("delivers server-recomputed prices and passes the optional topic", async () => {
    vi.stubEnv("TELEGRAM_MESSAGE_THREAD_ID", "42");
    const fetcher = vi.fn(async () =>
      Response.json({ ok: true, result: { message_id: 1 } }),
    );
    vi.stubGlobal("fetch", fetcher);
    const result = await POST(request({ ...fixture(), total: 1, price: 1 }));
    expect(result.status).toBe(200);
    expect(await result.json()).toMatchObject({
      success: true,
      reference: expect.stringMatching(/^CLX-/),
    });
    const args = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    const sent = JSON.parse(String(args[1].body));
    expect(sent.text).toContain("ИТОГО ОТ 5200 TRY");
    expect(sent.chat_id).toBe("-1001234567890");
    expect(sent.message_thread_id).toBe(42);
    expect(sent.parse_mode).toBe("HTML");
  });
  it("never reports success for Telegram ok=false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ ok: false, description: "private upstream data" }),
      ),
    );
    const response = await POST(request(fixture()));
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("private upstream data");
  });
  it("does not expose exceptions or secrets on network errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("test-only-token");
      }),
    );
    const response = await POST(request(fixture()));
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("token");
  });
  it("rejects missing credentials", async () => {
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    const response = await POST(request(fixture()));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ code: "CONFIGURATION" });
  });
  it("rejects a personal chat ID without calling Telegram", async () => {
    vi.stubEnv("TELEGRAM_CHAT_ID", "123456789");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const response = await POST(request(fixture()));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ code: "CONFIGURATION" });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects wrong content type", async () =>
    expect(
      (await POST(request(fixture(), { "Content-Type": "text/plain" }))).status,
    ).toBe(415));
  it("rejects cross-origin requests", async () =>
    expect((await POST(request(fixture(), OriginHeader()))).status).toBe(403));
  it("rejects malformed JSON", async () =>
    expect(
      (
        await POST(
          new Request("https://clenix.test/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: "{",
          }),
        )
      ).status,
    ).toBe(400));
  it("bounds streamed body size even without content length", async () =>
    expect((await POST(request({ notes: "x".repeat(17000) }))).status).toBe(
      413,
    ));
  it("rejects invalid consent on server", async () =>
    expect((await POST(request(fixture({ consent: false })))).status).toBe(
      422,
    ));
  it("rate limits before sending", async () => {
    vi.mocked(allowRequest).mockResolvedValue(false);
    expect((await POST(request(fixture()))).status).toBe(429);
  });
  it("reuses a successful reference without another send", async () => {
    vi.mocked(claimRequest).mockResolvedValue({
      kind: "sent",
      reference: "CLX-EXISTING",
    });
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const response = await POST(request(fixture()));
    expect(await response.json()).toEqual({
      success: true,
      reference: "CLX-EXISTING",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("does not resend pending requests", async () => {
    vi.mocked(claimRequest).mockResolvedValue({
      kind: "pending",
      reference: "CLX-PENDING",
    });
    expect((await POST(request(fixture()))).status).toBe(409);
  });
});
function OriginHeader() {
  return { Origin: "https://untrusted.test" };
}
