import { z } from "zod";
import { bounds, serviceIds } from "./services";
import { districts } from "./districts";
export const locales = ["tr", "ru", "kk", "en"] as const;
export type Locale = (typeof locales)[number];
export function istanbulToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "long")
    .refine(
      (v) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v),
      "invalid",
    );
const optionalText = (max: number) => text(max).default("");
export const bookingSchema = z
  .object({
    locale: z.enum(locales),
    district: z
      .string()
      .refine(
        (v) => districts.includes(v as (typeof districts)[number]),
        "district",
      ),
    neighborhood: optionalText(80),
    address: text(240).min(5, "required"),
    floor: optionalText(20),
    apartment: optionalText(20),
    access: optionalText(160),
    property: z.enum(["apartment", "house", "office", "other"]),
    service: z.enum(serviceIds),
    area: z.number().finite().optional(),
    acUnits: z.number().int("count").min(0, "count").max(bounds.acMax, "count"),
    rooms: z.number().int().min(0).max(100).optional(),
    bathrooms: z.number().int().min(0).max(100).optional(),
    dirt: z.enum(["light", "moderate", "heavy", "very-heavy"]),
    furnishing: z.enum(["empty", "partial", "full"]),
    date: z
      .string()
      .refine(
        (v) =>
          /^\d{4}-\d{2}-\d{2}$/.test(v) &&
          !Number.isNaN(Date.parse(v)) &&
          new Date(v).toISOString().slice(0, 10) === v &&
          v >= istanbulToday(),
        "date",
      ),
    time: z.enum(["any", "morning", "afternoon", "evening"]),
    notes: optionalText(600),
    name: text(80).min(2, "required"),
    phone: text(30).refine(
      (v) =>
        /^\+?[\d\s().-]+$/.test(v) &&
        v.replace(/\D/g, "").length >= 7 &&
        v.replace(/\D/g, "").length <= 15,
      "phone",
    ),
    contact: z.enum(["phone", "whatsapp", "telegram"]),
    telegram: z
      .string()
      .trim()
      .max(33, "long")
      .refine((v) => !v || /^@?[A-Za-z0-9_]{5,32}$/.test(v), "telegram")
      .default(""),
    consent: z.boolean().refine((v) => v, "consent"),
    website: z.string().max(0, "spam").default(""),
    requestId: z.uuid(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      v.service !== "ac" &&
      (v.area === undefined ||
        v.area < bounds.areaMin ||
        v.area > bounds.areaMax ||
        Math.abs(v.area * 10 - Math.round(v.area * 10)) > 1e-7)
    )
      ctx.addIssue({ code: "custom", path: ["area"], message: "area" });
    if (v.service === "ac" && v.acUnits < 1)
      ctx.addIssue({ code: "custom", path: ["acUnits"], message: "count" });
    if (v.area !== undefined && (v.area <= 0 || v.area > bounds.areaMax))
      ctx.addIssue({ code: "custom", path: ["area"], message: "area" });
  });
export type Booking = z.infer<typeof bookingSchema>;
