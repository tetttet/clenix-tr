import { Suspense } from "react";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "../globals.css";
import "@fontsource-variable/manrope";
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <Suspense>
            <Header locale={locale} />
          </Suspense>
          {children}
          <Suspense>
            <Footer locale={locale} />
          </Suspense>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
