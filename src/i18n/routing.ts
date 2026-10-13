import { defineRouting } from "next-intl/routing";
export const routing = defineRouting({
  locales: ["tr", "ru", "kk", "en"],
  defaultLocale: "tr",
  localePrefix: "always",
  localeDetection: false,
});
