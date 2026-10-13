import { assertLocale } from "@/lib/locale";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/lib/booking-schema";
import { pageMetadata } from "@/lib/seo";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  assertLocale(locale);
  const t = await getTranslations({ locale, namespace: "ui" });
  return pageMetadata(
    locale,
    "/terms",
    t("termsTitle"),
    t("termsBody").split("\n")[0],
  );
}
export default async function Policy({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  const t = await getTranslations("ui");
  return (
    <main id="main" className="container policy-page">
      <Link className="text-link" href={`/${locale}`}>
        ← {t("home")}
      </Link>
      <div className="eyebrow">CLENIX · ISTANBUL</div>
      <h1>{t("termsTitle")}</h1>
      {t("termsBody")
        .split("\n")
        .map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      <a className="button" href="tel:+905015284482">
        {t("call")} · 0501 528 44 82
      </a>
    </main>
  );
}
