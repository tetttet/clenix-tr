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
  const rows = [
    "<b>🧼 CLENIX — НОВАЯ ЗАЯВКА НА УБОРКУ</b>",
    `Номер заявки: ${reference}`,
    `Язык сайта: ${language}`,
    `Имя: ${b.name}`,
    `Телефон: ${b.phone}`,
    `Предпочтительный способ связи: ${option(b.contact)}${b.contact === "telegram" && b.telegram ? ` (${b.telegram})` : ""}`,
    `Адрес: Стамбул, ${b.district}, ${b.neighborhood}, ${b.address}`,
    `Этаж: ${b.floor || "—"}; квартира: ${b.apartment || "—"}`,
    `Доступ / домофон: ${b.access || "—"}`,
    `Тип помещения: ${option(b.property)}; площадь: ${b.service === "ac" ? "не учитывается в расчёте" : `${b.area} м²`}; комнат: ${b.rooms ?? "—"}; ванных: ${b.bathrooms ?? "—"}`,
    `Услуга: ${ru.services[b.service].name}`,
    `Количество кондиционеров: ${b.acUnits}`,
    `Загрязнение: ${option(b.dirt)}; меблировка: ${option(b.furnishing)}`,
    `Желаемая дата: ${b.date}; время: ${option(b.time)} (Стамбул)`,
    `Примечания: ${b.notes || "—"}`,
    `Предварительная стоимость от: ${b.service === "ac" ? "" : `${b.area} м² × ${services[b.service].rate} TRY = ${q.areaSubtotal} TRY; `}${b.acUnits} кондиционеров × ${services.ac.rate} TRY = ${q.acSubtotal} TRY; ИТОГО ОТ ${q.total} TRY`,
    "Итоговую цену и запись подтвердит команда CLENIX.",
    "Согласие с условиями заявки и уведомлением о конфиденциальности: да",
    `Отправлено: ${now.toISOString()} / ${new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Istanbul", dateStyle: "short", timeStyle: "medium" }).format(now)} (Стамбул)`,
  ];
  // Every customer-controlled line is escaped; the only HTML is our fixed title.
  return rows.map((line, i) => (i === 0 ? line : escapeHtml(line))).join("\n");
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
