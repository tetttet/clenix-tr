"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowRight, Calculator } from "lucide-react";
import { serviceIds, type ServiceId, bounds } from "@/lib/services";
import { estimate } from "@/lib/pricing";
import type { Locale } from "@/lib/booking-schema";
import QuoteSummary from "./QuoteSummary";
export default function QuickEstimator({ locale }: { locale: Locale }) {
  const t = useTranslations("ui"),
    s = useTranslations("services");
  const [service, setService] = useState<ServiceId>("deep-cleaning");
  const [area, setArea] = useState("70");
  const [ac, setAc] = useState(0);
  const valid = estimate(service, Number(area), ac);
  return (
    <div className="estimator">
      <div className="estimator-form">
        <div className="eyebrow">
          <Calculator size={16} />
          {t("estimatorEyebrow")}
        </div>
        <h2>{t("estimatorTitle")}</h2>
        <p>{t("estimatorBody")}</p>
        <label htmlFor="quick-service">{t("service")}</label>
        <select
          id="quick-service"
          value={service}
          onChange={(e) => {
            const v = e.target.value as ServiceId;
            setService(v);
            if (v === "ac" && ac < 1) setAc(1);
          }}
        >
          {serviceIds.map((id) => (
            <option key={id} value={id}>
              {s(`${id}.name`)}
            </option>
          ))}
        </select>
        <div className="form-grid">
          {service !== "ac" && (
            <div>
              <label htmlFor="quick-area">{t("area")}</label>
              <input
                id="quick-area"
                type="number"
                min={bounds.areaMin}
                max={bounds.areaMax}
                step="0.1"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                aria-describedby="quick-area-help"
              />
              <small id="quick-area-help">{t("areaHelp")}</small>
            </div>
          )}
          <div>
            <label htmlFor="quick-ac">{t("acUnits")}</label>
            <input
              id="quick-ac"
              type="number"
              min={service === "ac" ? 1 : 0}
              max={bounds.acMax}
              value={ac}
              onChange={(e) => setAc(Number(e.target.value))}
            />
          </div>
        </div>
        {valid ? (
          <Link
            className="button"
            href={`/${locale}/book?service=${service}${service !== "ac" ? `&area=${area}` : ""}&acUnits=${ac}`}
          >
            {t("continue")}
            <ArrowRight size={18} />
          </Link>
        ) : (
          <p className="field-error" role="status">
            {t(service === "ac" ? "enterUnits" : "enterArea")}
          </p>
        )}
      </div>
      <QuoteSummary
        locale={locale}
        service={service}
        area={Number(area)}
        acUnits={ac}
      />
    </div>
  );
}
