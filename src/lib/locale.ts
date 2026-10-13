import { notFound } from "next/navigation";
import { locales, type Locale } from "./booking-schema";
export function assertLocale(value: string): asserts value is Locale {
  if (!locales.includes(value as Locale)) notFound();
}
