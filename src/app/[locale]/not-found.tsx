import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
export default async function NotFound() {
  const locale = await getLocale(),
    t = await getTranslations("ui");
  return (
    <main id="main" className="container policy-page">
      <div className="eyebrow">CLENIX · 404</div>
      <h1>{t("notFoundTitle")}</h1>
      <p>{t("notFoundBody")}</p>
      <Link className="button" href={`/${locale}`}>
        {t("home")}
      </Link>
    </main>
  );
}
