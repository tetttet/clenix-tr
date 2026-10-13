"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { locales, type Locale } from "@/lib/booking-schema";
const languages = {
  tr: ["TR", "Türkçe"],
  ru: ["RU", "Русский"],
  kk: ["ҚАЗ", "Қазақша"],
  en: ["EN", "English"],
};
export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const t = useTranslations("ui");
  const pathname = usePathname();
  const search = useSearchParams();
  const preserved = new URLSearchParams();
  for (const key of ["service", "area", "acUnits"]) {
    const value = search.get(key);
    if (value) preserved.set(key, value);
  }
  const query = preserved.toString();
  return (
    <div className="languages" aria-label={t("language")}>
      {locales.map((l) => (
        <Link
          key={l}
          href={`${pathname.replace(/^\/(tr|ru|kk|en)(?=\/|$)/, `/${l}`)}${query ? `?${query}` : ""}`}
          hrefLang={l}
          lang={l}
          aria-label={languages[l][1]}
          aria-current={l === locale ? "true" : undefined}
          onClick={(e) => {
            if (window.location.hash)
              e.currentTarget.href += window.location.hash;
          }}
        >
          {languages[l][0]}
        </Link>
      ))}
    </div>
  );
}
export default function Header({ locale }: { locale: Locale }) {
  const t = useTranslations("ui");
  const [open, setOpen] = useState(false);
  const links = [
    ["services", "navServices"],
    ["why", "navWhy"],
    ["pricing", "navPricing"],
    ["how", "navHow"],
    ["faq", "navFaq"],
    ["contact", "navContact"],
  ];
  return (
    <>
      <a className="skip" href="#main">
        {t("skip")}
      </a>
      <header className="header">
        <div className="container header-inner">
          <Link href={`/${locale}`} className="brand" aria-label="CLENIX">
            <Image
              src="/brand/clenix-logo.jpg"
              width={58}
              height={58}
              alt="CLENIX"
              priority
            />
          </Link>
          <nav className="desktop-nav" aria-label={t("menu")}>
            {links.map(([id, key]) => (
              <Link key={id} href={`/${locale}#${id}`}>
                {t(key)}
              </Link>
            ))}
            <Link href={`/${locale}/reels`}>{t("navReels")}</Link>
          </nav>
          <div className="header-actions">
            <LanguageSwitcher locale={locale} />
            <Link
              className="button small header-quote"
              href={`/${locale}/book`}
            >
              {t("quote")}
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger
              className="icon-button mobile-menu"
              aria-label={t("menu")}
            >
              <Menu />
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="dialog-overlay" />
              <Dialog.Content className="mobile-panel">
                <Dialog.Title>CLENIX</Dialog.Title>
                <Dialog.Description className="sr-only">
                  {t("menu")}
                </Dialog.Description>
                <Dialog.Close
                  className="icon-button panel-close"
                  aria-label={t("close")}
                >
                  <X />
                </Dialog.Close>
                <nav>
                  {links.map(([id, key]) => (
                    <Link
                      onClick={() => setOpen(false)}
                      key={id}
                      href={`/${locale}#${id}`}
                    >
                      {t(key)}
                    </Link>
                  ))}
                  <Link
                    onClick={() => setOpen(false)}
                    href={`/${locale}/reels`}
                  >
                    {t("navReels")}
                  </Link>
                </nav>
                <Link
                  onClick={() => setOpen(false)}
                  className="button"
                  href={`/${locale}/book`}
                >
                  {t("quote")}
                  <ArrowUpRight size={18} />
                </Link>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </header>
    </>
  );
}
