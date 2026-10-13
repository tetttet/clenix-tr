import { describe, it, expect } from "vitest";
import { estimate } from "../src/lib/pricing";
import { serviceIds, services } from "../src/lib/services";
describe("canonical pricing", () => {
  it("matches all provided examples", () => {
    expect(estimate("deep-cleaning", 70, 0)?.total).toBe(4200);
    expect(estimate("deep-cleaning", 70, 2)?.total).toBe(5200);
    expect(estimate("renovation", 80, 0)?.total).toBe(7200);
    expect(estimate("ac", undefined, 2)?.total).toBe(1000);
  });
  it.each(serviceIds.filter((id) => id !== "ac"))(
    "uses only the canonical rate for %s",
    (id) => {
      expect(estimate(id, 100, 0)?.total).toBe(100 * services[id].rate);
    },
  );
  it("calculates decimal areas exactly in whole TRY", () => {
    expect(estimate("deep-cleaning", 72.5, 2)?.total).toBe(5350);
    expect(estimate("maintenance", 10.1, 0)?.total).toBe(505);
    expect(estimate("tenancy", 10.3, 0)?.total).toBe(721);
  });
  it("never prices area for AC only", () =>
    expect(estimate("ac", 999, 2)?.total).toBe(1000));
  it.each([undefined, 0, -10, 9.9, 20001, NaN, Infinity, 70.55])(
    "rejects invalid area %s",
    (area) => expect(estimate("deep-cleaning", area, 0)).toBeNull(),
  );
  it.each([-1, 0.5, 101, NaN, Infinity])(
    "rejects invalid AC counts %s",
    (count) => expect(estimate("ac", undefined, count)).toBeNull(),
  );
  it("requires units for AC-only", () =>
    expect(estimate("ac", undefined, 0)).toBeNull());
});
