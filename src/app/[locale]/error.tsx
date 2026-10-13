"use client";
import { useTranslations } from "next-intl";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const t = useTranslations("ui");
  return (
    <main id="main" className="container policy-page">
      <h1>{t("pageError")}</h1>
      <button className="button" onClick={reset}>
        {t("retry")}
      </button>
      <p>
        <a href="tel:+905015284482">0501 528 44 82</a>
      </p>
    </main>
  );
}
