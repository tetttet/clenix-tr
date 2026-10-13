import { assertLocale } from "@/lib/locale";
import { getTranslations, setRequestLocale } from "next-intl/server";
import BookingWizard from "@/components/BookingWizard";
import type { Locale } from "@/lib/booking-schema";
import { isService, bounds } from "@/lib/services";
import { pageMetadata } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  assertLocale(locale);
  const t = await getTranslations({ locale, namespace: "ui" });
  return pageMetadata(locale, "/book", t("book"), t("bookingBody"));
}
export default async function Book({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  const query = await searchParams;
  const service = isService(query.service) ? query.service : "deep-cleaning";
  const rawArea = Number(query.area);
  const area =
    Number.isFinite(rawArea) &&
    rawArea >= bounds.areaMin &&
    rawArea <= bounds.areaMax &&
    Math.abs(rawArea * 10 - Math.round(rawArea * 10)) < 1e-7
      ? rawArea
      : undefined;
  const rawAc = Number(query.acUnits);
  const acUnits =
    Number.isInteger(rawAc) &&
    rawAc >= (service === "ac" ? 1 : 0) &&
    rawAc <= bounds.acMax
      ? rawAc
      : service === "ac"
        ? 1
        : 0;
  return (
    <main id="main" className="booking-page">
      <div className="container">
        <BookingWizard locale={locale} initial={{ service, area, acUnits }} />
      </div>
    </main>
  );
}
