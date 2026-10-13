import { describe, it, expect } from "vitest";
import { bookingSchema, istanbulToday } from "../src/lib/booking-schema";
import { districts } from "../src/lib/districts";
import { fixture } from "./fixtures";
describe("validation", () => {
  it("accepts complete request and international numbers", () => {
    expect(bookingSchema.safeParse(fixture()).success).toBe(true);
    for (const phone of [
      "+7 (701) 123-45-67",
      "0501 528 44 82",
      "+44 20 7946 0000",
    ])
      expect(bookingSchema.safeParse(fixture({ phone })).success).toBe(true);
  });
  it("contains 39 unique districts", () =>
    expect(new Set(districts).size).toBe(39));
  it("requires no area for AC only", () =>
    expect(
      bookingSchema.safeParse(
        fixture({ service: "ac", area: undefined, acUnits: 2 }),
      ).success,
    ).toBe(true));
  it.each([
    { name: "" },
    { district: "Ankara" },
    { service: "fake" },
    { area: -1 },
    { area: 70.55 },
    { area: undefined },
    { acUnits: -1 },
    { acUnits: 1.5 },
    { consent: false },
    { phone: "123" },
    { phone: "abc123456789" },
    { date: "2020-01-01" },
    { date: "2099-02-30" },
    { date: "not-a-date" },
    { notes: "x".repeat(601) },
    { website: "bot" },
    { service: "ac", acUnits: 0 },
    { requestId: "bad" },
  ])("rejects invalid fields %j", (overrides) =>
    expect(
      bookingSchema.safeParse({ ...fixture(), ...overrides }).success,
    ).toBe(false),
  );
  it("uses Istanbul local day across UTC midnight", () =>
    expect(istanbulToday(new Date("2026-10-13T22:00:00Z"))).toBe("2026-10-14"));
  it("rejects unknown fields", () =>
    expect(
      bookingSchema.safeParse({ ...fixture(), surcharge: 50 }).success,
    ).toBe(false));
});
