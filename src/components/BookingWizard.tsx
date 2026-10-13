"use client";
import { useRef, useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  LoaderCircle,
  MapPin,
  LockKeyhole,
  ChevronDown,
} from "lucide-react";
import {
  bookingSchema,
  istanbulToday,
  type Booking,
  type Locale,
} from "@/lib/booking-schema";
import { serviceIds, services, bounds, type ServiceId } from "@/lib/services";
import { districts } from "@/lib/districts";
import { money, estimate } from "@/lib/pricing";
import ServiceIcon from "./ServiceIcon";
import QuoteSummary from "./QuoteSummary";
const stepFields: FieldPath<Booking>[][] = [
  [
    "district",
    "address",
    "neighborhood",
    "floor",
    "apartment",
    "property",
    "access",
  ],
  ["service"],
  [
    "area",
    "acUnits",
    "rooms",
    "bathrooms",
    "dirt",
    "furnishing",
    "date",
    "time",
    "notes",
  ],
  ["name", "phone", "contact", "telegram", "consent", "website"],
];
export default function BookingWizard({
  locale,
  initial,
}: {
  locale: Locale;
  initial: { service: ServiceId; area?: number; acUnits: number };
}) {
  const t = useTranslations("ui"),
    s = useTranslations("services"),
    o = useTranslations("options"),
    err = useTranslations("errors");
  const router = useRouter();
  const [step, setStep] = useState(0),
    [busy, setBusy] = useState(false),
    [failure, setFailure] = useState(""),
    [reference, setReference] = useState(""),
    [acEnabled, setAcEnabled] = useState(initial.acUnits > 0);
  const sending = useRef(false),
    requestId = useRef(""),
    heading = useRef<HTMLHeadingElement>(null);
  const {
    register,
    watch,
    setValue,
    setError,
    clearErrors,
    setFocus,
    getValues,
    formState: { errors },
  } = useForm<Booking>({
    defaultValues: {
      locale,
      service: initial.service,
      area: initial.area,
      acUnits: initial.acUnits,
      district: "",
      address: "",
      neighborhood: "",
      floor: "",
      apartment: "",
      access: "",
      property: "apartment",
      dirt: "moderate",
      furnishing: "full",
      date: "",
      time: "any",
      notes: "",
      name: "",
      phone: "",
      contact: "phone",
      telegram: "",
      consent: false,
      website: "",
      requestId: "00000000-0000-4000-8000-000000000000",
    },
  });
  const value = watch();
  const currentQuote = estimate(value.service, value.area, value.acUnits || 0);
  function syncChoices(
    service = value.service,
    area = value.area,
    acUnits = value.acUnits,
  ) {
    const params = new URLSearchParams({ service, acUnits: String(acUnits) });
    if (service !== "ac" && area && Number.isFinite(area))
      params.set("area", String(area));
    router.replace(`/${locale}/book?${params}`, { scroll: false });
  }
  function changeService(service: ServiceId) {
    setValue("service", service);
    if (service === "ac") setValue("area", undefined);
    const units =
      service === "ac"
        ? Math.max(1, getValues("acUnits") || 0)
        : getValues("acUnits");
    setValue("acUnits", units);
    setAcEnabled(units > 0);
    clearErrors(["service", "area", "acUnits"]);
    syncChoices(service, getValues("area"), units);
  }
  function go(next: number) {
    setStep(next);
    setFailure("");
    requestAnimationFrame(() => {
      heading.current?.focus();
      heading.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  function validate(all = false) {
    clearErrors();
    const parsed = bookingSchema.safeParse({ ...getValues(), locale });
    if (parsed.success) return parsed.data;
    const issues = parsed.error.issues.filter(
      (i) => all || stepFields[step].includes(i.path[0] as FieldPath<Booking>),
    );
    if (!issues.length) return getValues();
    for (const i of issues) {
      const key = i.path[0] as FieldPath<Booking>;
      setError(key, {
        type: "manual",
        message: err.has(i.message) ? err(i.message) : err("invalid"),
      });
    }
    const first = issues[0].path[0] as FieldPath<Booking>;
    if (all) {
      const target = stepFields.findIndex((f) => f.includes(first));
      if (target >= 0 && target !== step) setStep(target);
    }
    setTimeout(() => setFocus(first), 30);
    return null;
  }
  async function submit() {
    if (sending.current) return;
    const data = validate(true);
    if (!data) return;
    sending.current = true;
    setBusy(true);
    setFailure("");
    if (!requestId.current) requestId.current = crypto.randomUUID();
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale, requestId: requestId.current }),
        signal: AbortSignal.timeout(25_000),
      });
      const result = (await response.json()) as {
        success?: boolean;
        reference?: string;
        code?: string;
      };
      if (response.ok && result.success && result.reference) {
        setReference(result.reference);
        requestAnimationFrame(() => heading.current?.focus());
      } else {
        setFailure(
          result.code === "CONFIGURATION"
            ? "configError"
            : result.code === "RATE_LIMIT"
              ? "rateError"
              : result.code === "PENDING"
                ? "pendingError"
                : "error",
        );
      }
    } catch {
      setFailure("error");
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  function advance() {
    if (step < 3) {
      if (validate()) {
        syncChoices();
        go(step + 1);
      }
    } else void submit();
  }
  const numeric = {
    setValueAs: (v: string) => (v === "" ? undefined : Number(v)),
  };
  function field(
    name: FieldPath<Booking>,
    type = "text",
    optional = false,
    maxLength?: number,
  ) {
    const error = errors[name]?.message;
    return (
      <div
        className={
          name === "address" || name === "notes" || name === "access"
            ? "full-width"
            : ""
        }
        key={name}
      >
        <label htmlFor={name}>
          {t(name)}{" "}
          {optional ? (
            <span className="optional">({t("optional")})</span>
          ) : (
            <span aria-hidden="true">*</span>
          )}
        </label>
        {name === "notes" || name === "access" ? (
          <textarea
            id={name}
            maxLength={maxLength}
            rows={3}
            {...register(name)}
            aria-required={!optional}
            aria-invalid={!!error}
            aria-describedby={error ? `${name}-error` : undefined}
          />
        ) : (
          <input
            id={name}
            type={type}
            maxLength={maxLength}
            min={
              type === "date"
                ? istanbulToday()
                : name === "area"
                  ? bounds.areaMin
                  : name === "acUnits" && value.service === "ac"
                    ? 1
                    : 0
            }
            max={
              name === "area"
                ? bounds.areaMax
                : type === "number"
                  ? 100
                  : undefined
            }
            step={name === "area" ? "0.1" : type === "number" ? 1 : undefined}
            autoComplete={
              name === "name"
                ? "name"
                : name === "phone"
                  ? "tel"
                  : name === "address"
                    ? "street-address"
                    : "off"
            }
            {...register(name, type === "number" ? numeric : {})}
            aria-required={!optional}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${name}-error`
                : name === "area"
                  ? "area-help"
                  : name === "date"
                    ? "date-help"
                    : undefined
            }
            onBlur={() => {
              if (name === "area" || name === "acUnits") syncChoices();
            }}
          />
        )}
        {error && (
          <p className="field-error" id={`${name}-error`}>
            {error}
          </p>
        )}
        {name === "area" && <small id="area-help">{t("areaHelp")}</small>}
        {name === "date" && <small id="date-help">{t("dateHelp")}</small>}
      </div>
    );
  }
  function select(
    name: "property" | "dirt" | "furnishing" | "time" | "contact",
    options: string[],
  ) {
    return (
      <div key={name}>
        <label htmlFor={name}>{t(name)}</label>
        <select
          id={name}
          {...register(name, {
            onChange: (event) => {
              if (name === "contact" && event.target.value !== "telegram")
                setValue("telegram", "");
            },
          })}
          aria-invalid={!!errors[name]}
          aria-describedby={errors[name] ? `${name}-error` : undefined}
        >
          {options.map((v) => (
            <option key={v} value={v}>
              {o(v)}
            </option>
          ))}
        </select>
        {errors[name]?.message && (
          <p id={`${name}-error`} className="field-error">
            {errors[name]?.message}
          </p>
        )}
      </div>
    );
  }
  if (reference)
    return (
      <section className="success-card">
        <div className="success-icon">
          <CheckCircle2 size={44} />
        </div>
        <div className="eyebrow">CLENIX · ISTANBUL</div>
        <h1 ref={heading} tabIndex={-1}>
          {t("successTitle")}
        </h1>
        <p>{t("successBody")}</p>
        <div className="reference">
          {t("reference")}
          <strong>{reference}</strong>
        </div>
        <Link href={`/${locale}`} className="button">
          {t("home")}
          <ArrowRight size={18} />
        </Link>
        <a href="tel:+905015284482">0501 528 44 82</a>
      </section>
    );
  const steps = ["location", "service", "details", "contactStep"];
  const reviewFields: FieldPath<Booking>[] = [
    "district",
    "neighborhood",
    "address",
    "floor",
    "apartment",
    "access",
    "property",
    "service",
    ...(value.service === "ac" ? [] : (["area"] as FieldPath<Booking>[])),
    "acUnits",
    "rooms",
    "bathrooms",
    "dirt",
    "furnishing",
    "date",
    "time",
    "notes",
    "name",
    "phone",
    "contact",
    ...(value.contact === "telegram"
      ? (["telegram"] as FieldPath<Booking>[])
      : []),
  ];
  function display(name: FieldPath<Booking>) {
    const v = value[name];
    if (v === undefined || v === "") return "—";
    if (name === "service") return s(`${String(v)}.name`);
    if (["property", "dirt", "furnishing", "time", "contact"].includes(name))
      return o(String(v));
    if (name === "date" && typeof v === "string" && v)
      return new Intl.DateTimeFormat(locale, {
        dateStyle: "long",
        timeZone: "Europe/Istanbul",
      }).format(new Date(`${v}T12:00:00+03:00`));
    return typeof v === "number"
      ? new Intl.NumberFormat(locale).format(v)
      : String(v);
  }
  return (
    <>
      <ol className="progress" aria-label={t("bookingTitle")}>
        {steps.map((key, i) => (
          <li
            key={key}
            aria-current={step === i ? "step" : undefined}
            className={i <= step ? "active" : ""}
          >
            <button
              type="button"
              disabled={i > step || busy}
              onClick={() => go(i)}
            >
              <span>{i < step ? <Check size={17} /> : i + 1}</span>
              {t(key)}
            </button>
          </li>
        ))}
      </ol>
      <div className="booking-grid">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            advance();
          }}
          className="wizard-card"
        >
          <div className="wizard-heading">
            <span className="eyebrow">0{step + 1} / 04</span>
            <h1 ref={heading} tabIndex={-1}>
              {t(
                [
                  "locationTitle",
                  "serviceTitle",
                  "detailsTitle",
                  "contactTitle",
                ][step],
              )}
            </h1>
            <small>{t("requiredNote")}</small>
          </div>
          <fieldset disabled={busy}>
            {step === 0 && (
              <div className="form-grid">
                <div className="city-fixed">
                  <MapPin size={20} />
                  <div>
                    <small>{t("city")}</small>
                    <strong>İstanbul</strong>
                  </div>
                  <LockKeyhole size={16} />
                </div>
                <div>
                  <label htmlFor="district">{t("district")} *</label>
                  <input
                    id="district"
                    list="istanbul-districts"
                    placeholder={t("chooseDistrict")}
                    {...register("district")}
                    aria-required="true"
                    aria-invalid={!!errors.district}
                    aria-describedby={
                      errors.district ? "district-error" : undefined
                    }
                  />
                  <datalist id="istanbul-districts">
                    {districts.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                  {errors.district && (
                    <p className="field-error" id="district-error">
                      {errors.district.message}
                    </p>
                  )}
                </div>
                {field("neighborhood", "text", true, 80)}
                {select("property", ["apartment", "house", "office", "other"])}
                {field("address", "text", false, 240)}
                {field("floor", "text", true, 20)}
                {field("apartment", "text", true, 20)}
                {field("access", "text", true, 160)}
              </div>
            )}
            {step === 1 && (
              <div
                className="service-options"
                role="radiogroup"
                aria-label={t("service")}
              >
                {serviceIds.map((id) => (
                  <label
                    className={`service-option ${value.service === id ? "selected" : ""}`}
                    key={id}
                  >
                    <input
                      type="radio"
                      {...register("service")}
                      value={id}
                      checked={value.service === id}
                      onChange={() => changeService(id)}
                    />
                    <span className="service-option-icon">
                      <ServiceIcon service={id} />
                    </span>
                    <span>
                      <strong>{s(`${id}.name`)}</strong>
                      <small>{s(`${id}.description`)}</small>
                      <b>
                        {id !== "ac" && `${t("from")} `}
                        {money(services[id].rate, locale)} /{" "}
                        {id === "ac" ? t("unit") : "m²"}
                      </b>
                    </span>
                    <span className="radio-mark">
                      {value.service === id && <Check size={13} />}
                    </span>
                  </label>
                ))}
              </div>
            )}
            {step === 2 && (
              <div className="form-grid">
                {value.service !== "ac" && field("area", "number")}
                {value.service === "ac" ? (
                  field("acUnits", "number")
                ) : (
                  <div className="ac-extra full-width">
                    <label className="check-label">
                      <input
                        type="checkbox"
                        checked={acEnabled}
                        onChange={(e) => {
                          setAcEnabled(e.target.checked);
                          setValue("acUnits", e.target.checked ? 1 : 0);
                          syncChoices(
                            value.service,
                            value.area,
                            e.target.checked ? 1 : 0,
                          );
                        }}
                      />
                      {t("addAc")}
                      <strong>
                        {money(services.ac.rate, locale)} / {t("unit")}
                      </strong>
                    </label>
                    {acEnabled && field("acUnits", "number")}
                  </div>
                )}
                {field("rooms", "number", true)}
                {field("bathrooms", "number", true)}
                {select("dirt", ["light", "moderate", "heavy", "very-heavy"])}
                {select("furnishing", ["empty", "partial", "full"])}
                {field("date", "date")}
                {select("time", ["any", "morning", "afternoon", "evening"])}
                {field("notes", "text", true, 600)}
                <small className="full-width">{t("notesHelp")}</small>
              </div>
            )}
            {step === 3 && (
              <>
                <div className="form-grid">
                  {field("name", "text", false, 80)}
                  {field("phone", "tel", false, 30)}
                  {select("contact", ["phone", "whatsapp", "telegram"])}
                  {value.contact === "telegram" &&
                    field("telegram", "text", true, 33)}
                  <small className="full-width">{t("contactHelp")}</small>
                </div>
                <div className="review">
                  <h3>{t("review")}</h3>
                  <dl>
                    <div>
                      <dt>{t("city")}</dt>
                      <dd>İstanbul</dd>
                    </div>
                    {reviewFields.map((key) => (
                      <div key={key}>
                        <dt>{t(key)}</dt>
                        <dd>{display(key)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <label className="check-label consent">
                  <input
                    type="checkbox"
                    {...register("consent")}
                    aria-required="true"
                    aria-invalid={!!errors.consent}
                    aria-describedby={
                      errors.consent ? "consent-error" : undefined
                    }
                  />
                  <span>{t("consent")}</span>
                </label>
                {errors.consent && (
                  <p id="consent-error" className="field-error">
                    {errors.consent.message}
                  </p>
                )}
                <div className="policy-links">
                  <Link target="_blank" href={`/${locale}/privacy`}>
                    {t("privacy")}
                  </Link>
                  <Link target="_blank" href={`/${locale}/terms`}>
                    {t("terms")}
                  </Link>
                </div>
              </>
            )}
            <div className="honeypot" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                tabIndex={-1}
                autoComplete="off"
                {...register("website")}
              />
            </div>
          </fieldset>
          {failure && (
            <div className="submit-error" role="alert">
              {t(failure)} <a href="tel:+905015284482">0501 528 44 82</a>
            </div>
          )}
          <div className="wizard-buttons">
            {step > 0 ? (
              <button
                type="button"
                className="button secondary"
                onClick={() => go(step - 1)}
                disabled={busy}
              >
                <ArrowLeft size={18} />
                {t("back")}
              </button>
            ) : (
              <Link className="back-home" href={`/${locale}`}>
                <ArrowLeft size={16} />
                {t("home")}
              </Link>
            )}
            <button className="button" type="submit" disabled={busy}>
              {busy ? <LoaderCircle className="spin" size={18} /> : null}
              {t(busy ? "sending" : step === 3 ? "send" : "continue")}
              {!busy && <ArrowRight size={18} />}
            </button>
          </div>
        </form>
        <aside className="booking-summary">
          <div className="desktop-summary">
            <QuoteSummary
              locale={locale}
              service={value.service}
              area={value.area}
              acUnits={value.acUnits || 0}
              district={value.district}
              property={value.property}
            />
          </div>
          <details className="mobile-summary">
            <summary>
              <span>
                {t("summary")}
                <small className="compact-price" aria-live="polite">
                  {currentQuote
                    ? `${t("estimate")}: ${money(currentQuote.total, locale)}`
                    : t(value.service === "ac" ? "enterUnits" : "enterArea")}
                </small>
              </span>
              <ChevronDown size={18} />
            </summary>
            <QuoteSummary
              locale={locale}
              service={value.service}
              area={value.area}
              acUnits={value.acUnits || 0}
              district={value.district}
              property={value.property}
            />
          </details>
          <div className="summary-help">
            <span>{t("call")}</span>
            <a href="tel:+905015284482">
              0501 528 44 82
              <ArrowRight size={16} />
            </a>
          </div>
        </aside>
      </div>
      <div
        className="booking-mobile-nav"
        role="group"
        aria-label={t("bookingTitle")}
      >
        {step > 0 ? (
          <button
            type="button"
            className="booking-mobile-back"
            onClick={() => go(step - 1)}
            disabled={busy}
          >
            <ArrowLeft size={17} />
            <span>{t("back")}</span>
          </button>
        ) : (
          <Link className="booking-mobile-back" href={`/${locale}`}>
            <ArrowLeft size={17} />
            <span>{t("home")}</span>
          </Link>
        )}
        <div
          className="booking-mobile-price"
          aria-live="polite"
          aria-atomic="true"
        >
          <span>{t("priceFrom")}</span>
          <strong>{currentQuote ? money(currentQuote.total, locale) : "—"}</strong>
        </div>
        <button
          className="button booking-mobile-next"
          type="button"
          onClick={advance}
          disabled={busy}
        >
          {busy ? <LoaderCircle className="spin" size={17} /> : null}
          <span>{t(busy ? "sending" : step === 3 ? "send" : "continue")}</span>
          {!busy && <ArrowRight size={17} />}
        </button>
      </div>
    </>
  );
}
