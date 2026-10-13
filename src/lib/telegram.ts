import type { Booking } from "./booking-schema";
import { estimate } from "./pricing";
import { services } from "./services";
import ru from "../../messages/ru.json";
export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
export function formatTelegram(
  b: Booking,
  reference: string,
  now = new Date(),
) {
  const q = estimate(b.service, b.area, b.acUnits);
  if (!q) throw new Error("INVALID_ESTIMATE");
  const option = (v: keyof typeof ru.options) => ru.options[v];
  const language = {
    ru: "Русский",
    tr: "Турецкий",
    kk: "Казахский",
    en: "Английский",
  }[b.locale];
  const safe = (value: string | number) => escapeHtml(String(value));
  const numbers = new Intl.NumberFormat("ru-RU");
  const amount = (value: number) => `${numbers.format(value)} ₺`;
  const desiredDate = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${b.date}T12:00:00Z`));
  const submittedAt = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Istanbul",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  const location = ["Стамбул", b.district, b.neighborhood]
    .filter(Boolean)
    .map(safe)
    .join(" · ");
  const rows = [
    "🧼 <b>НОВАЯ ЗАЯВКА · CLENIX</b>",
    `<b>№ ${safe(reference)}</b> · ${safe(language)}`,
    "",
    "📅 <b>Дата и время</b>",
    `<b>${safe(desiredDate)}</b> · ${safe(option(b.time))}`,
    "Время указано по Стамбулу",
    "",
    "👤 <b>Клиент</b>",
    `Имя: ${safe(b.name)}`,
    `Телефон: ${safe(b.phone)}`,
    `Связь: ${safe(option(b.contact))}${b.contact === "telegram" && b.telegram ? ` · ${safe(b.telegram)}` : ""}`,
    "",
    "📍 <b>Адрес</b>",
    location,
    safe(b.address),
    `Этаж: ${safe(b.floor || "—")} · Квартира: ${safe(b.apartment || "—")}`,
    `Доступ / домофон: ${safe(b.access || "—")}`,
    "",
    "🧹 <b>Детали уборки</b>",
    `Услуга: ${safe(ru.services[b.service].name)}`,
    `Помещение: ${safe(option(b.property))}${b.service === "ac" ? "" : ` · ${safe(numbers.format(b.area!))} м²`}`,
    `Комнат: ${safe(b.rooms ?? "—")} · Ванных: ${safe(b.bathrooms ?? "—")}`,
    `Кондиционеры: ${safe(b.acUnits)}`,
    `Загрязнение: ${safe(option(b.dirt))} · Мебель: ${safe(option(b.furnishing))}`,
    ...(b.notes ? ["", "📝 <b>Пожелания</b>", safe(b.notes)] : []),
    "",
    "💰 <b>Предварительная стоимость</b>",
    ...(b.service === "ac"
      ? []
      : [
          `Уборка: ${safe(numbers.format(b.area!))} м² × ${amount(services[b.service].rate)} = ${amount(q.areaSubtotal)}`,
        ]),
    ...(b.acUnits
      ? [
          `Кондиционеры: ${safe(b.acUnits)} × ${amount(services.ac.rate)} = ${amount(q.acSubtotal)}`,
        ]
      : []),
    `<b>Итого от: ${amount(q.total)}</b>`,
    "Итоговую цену и запись подтвердит команда CLENIX.",
    "",
    `Отправлено: ${safe(submittedAt)} (Стамбул)`,
    "Согласие с условиями заявки: получено",
  ];
  // Escape every dynamic value before adding the fixed Telegram HTML markup.
  return rows.join("\n");
}
export function telegramConfigured() {
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  const thread = process.env.TELEGRAM_MESSAGE_THREAD_ID;
  return (
    !!process.env.TELEGRAM_BOT_TOKEN &&
    !!chatId &&
    /^-[1-9]\d*$/.test(chatId) &&
    (!thread ||
      (/^\d+$/.test(thread) &&
        Number.isSafeInteger(Number(thread)) &&
        Number(thread) > 0))
  );
}
export class TelegramRejection extends Error {}
export async function sendTelegram(b: Booking, reference: string) {
  if (!telegramConfigured()) throw new Error("CONFIGURATION");
  const thread = process.env.TELEGRAM_MESSAGE_THREAD_ID;
  if (thread && (!/^\d+$/.test(thread) || Number(thread) < 1))
    throw new Error("CONFIGURATION");
  const response = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10_000),
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID?.trim(),
        ...(thread ? { message_thread_id: Number(thread) } : {}),
        text: formatTelegram(b, reference),
        parse_mode: "HTML",
      }),
    },
  );
  const result: unknown = await response.json();
  if (
    result &&
    typeof result === "object" &&
    "ok" in result &&
    result.ok === false
  )
    throw new TelegramRejection("DELIVERY");
  if (
    !response.ok ||
    !result ||
    typeof result !== "object" ||
    !("ok" in result) ||
    result.ok !== true
  )
    throw new Error("DELIVERY_UNCERTAIN");
}
