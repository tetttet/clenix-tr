import { bounds, services, type ServiceId } from "./services";
// Areas use at most one decimal place. All canonical rates therefore yield whole TRY.
export function estimate(service: ServiceId, area?: number, acUnits = 0) {
  const rate = services[service].rate;
  if (!Number.isInteger(acUnits) || acUnits < 0 || acUnits > bounds.acMax)
    return null;
  if (service === "ac")
    return acUnits >= 1
      ? {
          rate,
          areaSubtotal: 0,
          acSubtotal: acUnits * services.ac.rate,
          total: acUnits * services.ac.rate,
        }
      : null;
  if (
    !area ||
    !Number.isFinite(area) ||
    area < bounds.areaMin ||
    area > bounds.areaMax ||
    Math.abs(area * 10 - Math.round(area * 10)) > 1e-7
  )
    return null;
  const areaSubtotal = (Math.round(area * 10) * rate) / 10;
  const acSubtotal = acUnits * services.ac.rate;
  return { rate, areaSubtotal, acSubtotal, total: areaSubtotal + acSubtotal };
}
export function money(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "kk" ? "kk-KZ" : locale, {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}
export function number(value: number, locale: string) {
  return new Intl.NumberFormat(locale).format(value);
}
