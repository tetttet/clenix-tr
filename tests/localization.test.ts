import { it, expect } from "vitest";
import tr from "../messages/tr.json";
import ru from "../messages/ru.json";
import kk from "../messages/kk.json";
import en from "../messages/en.json";
function keys(value: unknown, prefix = ""): string[] {
  return Object.entries(value as Record<string, unknown>).flatMap(([key, v]) =>
    typeof v === "string" ? [`${prefix}${key}`] : keys(v, `${prefix}${key}.`),
  );
}
function values(value: unknown): string[] {
  return Object.values(value as Record<string, unknown>).flatMap((v) =>
    typeof v === "string" ? [v] : values(v),
  );
}
it("has complete, non-empty dictionaries in every locale", () => {
  for (const dictionary of [tr, ru, kk, en]) {
    expect(keys(dictionary).sort()).toEqual(keys(en).sort());
    expect(values(dictionary).every((v) => v.trim().length > 0)).toBe(true);
  }
});
it("contains native Turkish and Kazakh characters", () => {
  expect(JSON.stringify(tr)).toMatch(/[ıİğşçöü]/);
  expect(JSON.stringify(kk)).toMatch(/[әғқңөұүһі]/);
});
