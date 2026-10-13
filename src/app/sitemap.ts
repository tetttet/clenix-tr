import type { MetadataRoute } from "next";
import { locales } from "@/lib/booking-schema";
import { siteUrl } from "@/lib/seo";
export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) =>
    ["", "/book", "/reels", "/privacy", "/terms"].map((path) => ({
      url: `${siteUrl}/${locale}${path}`,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${siteUrl}/${l}${path}`]),
        ),
      },
    })),
  );
}
