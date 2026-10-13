export const serviceIds = [
  "deep-cleaning",
  "maintenance",
  "renovation",
  "tenancy",
  "disinfection",
  "ac",
] as const;
export type ServiceId = (typeof serviceIds)[number];
export const services: Record<
  ServiceId,
  { rate: number; unit: "area" | "unit" }
> = {
  "deep-cleaning": { rate: 60, unit: "area" },
  maintenance: { rate: 50, unit: "area" },
  renovation: { rate: 90, unit: "area" },
  tenancy: { rate: 70, unit: "area" },
  disinfection: { rate: 70, unit: "area" },
  ac: { rate: 500, unit: "unit" },
};
export const bounds = { areaMin: 10, areaMax: 20_000, acMax: 100 };
export function isService(value: unknown): value is ServiceId {
  return serviceIds.includes(value as ServiceId);
}
