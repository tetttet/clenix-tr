import type { Metadata } from "next";
import { locales, type Locale } from "./booking-schema";
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
export function pageMetadata(
  locale: Locale,
  path: string,
  title: string,
  description: string,
): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    title: `${title} | CLENIX Istanbul`,
    description,
    alternates: {
      canonical: `/${locale}${path}`,
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])),
        "x-default": `/tr${path}`,
      },
    },
    openGraph: {
      title: `${title} | CLENIX`,
      description,
      url: `/${locale}${path}`,
      siteName: "CLENIX Istanbul",
      type: "website",
      locale: { tr: "tr_TR", ru: "ru_RU", kk: "kk_KZ", en: "en_US" }[locale],
      images: [
        {
          url: "/brand/clenix-logo.jpg",
          width: 1080,
          height: 1080,
          alt: "CLENIX",
        },
      ],
    },
    twitter: {
      card: "summary",
      title: `${title} | CLENIX`,
      description,
      images: ["/brand/clenix-logo.jpg"],
    },
  };
}
