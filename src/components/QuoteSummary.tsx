"use client";
import { useTranslations } from "next-intl";
import { Info, ArrowUpRight } from "lucide-react";
import { estimate, money, number } from "@/lib/pricing";
import { services, type ServiceId } from "@/lib/services";
import type { Locale } from "@/lib/booking-schema";
export default function QuoteSummary({
  locale,
  service,
  area,
  acUnits,
  district,
  property,
}: {
  locale: Locale;
  service: ServiceId;
  area?: number;
  acUnits: number;
  district?: string;
  property?: string;
}) {
  const t = useTranslations("ui");
  const s = useTranslations("services");
  const o = useTranslations("options");
  const q = estimate(service, area, acUnits);
  return (
    <div className="quote-summary">
      <div className="summary-heading">
        <span>{t("summary")}</span>
        <ArrowUpRight size={20} />
      </div>
      <h3>{s(`${service}.name`)}</h3>
      {district && (
        <p className="summary-place">
          İstanbul · {district} {property ? `· ${o(property)}` : ""}
        </p>
      )}
      <div className="summary-lines">
        {service !== "ac" && (
          <div>
            <span>
              {area ? `${number(area, locale)} m² × ` : ""}
              {money(services[service].rate, locale)}/m²
            </span>
            <strong>{q ? money(q.areaSubtotal, locale) : "—"}</strong>
          </div>
        )}
        {acUnits > 0 && (
          <div>
            <span>
              {number(acUnits, locale)} × {money(services.ac.rate, locale)} /{" "}
              {t("unit")}
            </span>
            <strong>{q ? money(q.acSubtotal, locale) : "—"}</strong>
          </div>
        )}
      </div>
      <div className="quote-total" aria-live="polite" aria-atomic="true">
        <span>{t("estimate")}</span>
        {q ? (
          <strong>{money(q.total, locale)}</strong>
        ) : (
          <p>{t(service === "ac" ? "enterUnits" : "enterArea")}</p>
        )}
      </div>
      <p className="disclaimer">
        <Info size={16} />
        <span>{t("disclaimer")}</span>
      </p>
    </div>
  );
}
