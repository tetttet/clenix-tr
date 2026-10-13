import { assertLocale } from "@/lib/locale";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  Phone,
  MessageCircle,
  MessagesSquare,
  Calculator,
  SlidersHorizontal,
  Check,
  Plus,
  Sofa,
  House,
  Sparkles,
  Navigation,
} from "lucide-react";
import { serviceIds, services } from "@/lib/services";
import { money } from "@/lib/pricing";
import type { Locale } from "@/lib/booking-schema";
import { pageMetadata } from "@/lib/seo";
import RoomIllustration from "@/components/RoomIllustration";
import ServiceIcon from "@/components/ServiceIcon";
import QuickEstimator from "@/components/QuickEstimator";
import InstagramCarousel from "@/components/InstagramCarousel";
import { getInstagramPosts } from "@/lib/instagram-posts";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  assertLocale(locale);
  const t = await getTranslations({ locale, namespace: "ui" });
  return pageMetadata(
    locale,
    "",
    `${t("heroTitle")} ${t("heroAccent")}`,
    t("heroBody"),
  );
}
export default async function Home({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  const t = await getTranslations("ui"),
    s = await getTranslations("services");
  return (
    <main id="main">
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="live-dot" />
              {t("eyebrow")}
            </div>
            <h1>
              {t("heroTitle")}
              <span>{t("heroAccent")}</span>
            </h1>
            <p className="hero-body">{t("heroBody")}</p>
            <div className="hero-actions">
              <Link href={`/${locale}/book`} className="button">
                {t("quote")}
                <ArrowUpRight size={20} />
              </Link>
              <a href="tel:+905015284482" className="phone-button">
                <Phone size={19} />
                <span>
                  <small>{t("call")}</small>0501 528 44 82
                </span>
              </a>
            </div>
            <div className="hero-note">
              <span>
                <Check size={14} />
              </span>
              {t("heroNote")}
            </div>
          </div>
          <div className="hero-visual">
            <div className="visual-label">
              <span>CLENIX</span>
              <Sparkles size={16} />
              <span>ISTANBUL</span>
            </div>
            <RoomIllustration label={t("visualAlt")} />
            <div className="visual-badge">
              <span className="badge-icon">
                <MapPin size={21} />
              </span>
              <span>
                İstanbul<small>{t("coverage")}</small>
              </span>
              <ArrowUpRight size={18} />
            </div>
            <div className="visual-caption">
              {t("visualCaption")}
              <span>✦</span>
            </div>
          </div>
        </div>
      </section>
      <div className="trust-strip">
        <div className="container">
          {[
            [MapPin, "coverage"],
            [MessagesSquare, "russian"],
            [Calculator, "clearRates"],
            [SlidersHorizontal, "personal"],
          ].map(([Icon, key]) => {
            const I = Icon as typeof MapPin;
            return (
              <div key={String(key)}>
                <I size={22} strokeWidth={1.5} />
                <span>{t(String(key))}</span>
              </div>
            );
          })}
        </div>
      </div>
      <section id="services" className="section container">
        <div className="section-heading">
          <div>
            <div className="eyebrow">{t("servicesEyebrow")}</div>
            <h2>{t("servicesTitle")}</h2>
          </div>
          <p>{t("servicesBody")}</p>
        </div>
        <div className="services-grid">
          {serviceIds.map((id, i) => (
            <Link
              href={`/${locale}/book?service=${id}`}
              key={id}
              className={`service-card service-${id}`}
            >
              <div className="service-card-top">
                <span className="service-icon">
                  <ServiceIcon service={id} />
                </span>
                <span className="service-index">0{i + 1}</span>
              </div>
              <h3>{s(`${id}.name`)}</h3>
              <p>{s(`${id}.description`)}</p>
              <div className="service-bottom">
                <div>
                  <small>{id !== "ac" ? t("from") : t("service")}</small>
                  <strong>
                    {money(services[id].rate, locale)}
                    <span> / {id === "ac" ? t("unit") : "m²"}</span>
                  </strong>
                </div>
                <span className="round-arrow" aria-label={t("selectService")}>
                  <ArrowUpRight size={21} />
                </span>
              </div>
            </Link>
          ))}
        </div>
        <p className="services-disclaimer">{t("disclaimer")}</p>
      </section>
      <section id="pricing" className="pricing-section">
        <div className="container">
          <QuickEstimator locale={locale} />
          <div className="factors">
            <div>
              <h3>{t("factorsTitle")}</h3>
              <p>{t("factorsBody")}</p>
            </div>
            <div className="factor-grid">
              {[
                [Navigation, "factorAddress"],
                [Sparkles, "factorDirt"],
                [Sofa, "factorFurniture"],
                [House, "factorSpace"],
              ].map(([Icon, key]) => {
                const I = Icon as typeof House;
                return (
                  <div key={String(key)}>
                    <I size={20} />
                    <span>{t(String(key))}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      <section id="how" className="section container">
        <div className="center-heading">
          <div className="eyebrow">{t("howEyebrow")}</div>
          <h2>{t("howTitle")}</h2>
        </div>
        <div className="how-grid">
          {[1, 2, 3, 4].map((n) => (
            <div className="how-step" key={n}>
              <div className="step-number">
                0{n}
                <span>
                  <ArrowRight size={20} />
                </span>
              </div>
              <h3>{t(`how${n}`)}</h3>
              <p>{t(`how${n}Body`)}</p>
            </div>
          ))}
        </div>
      </section>
      <section id="why" className="why-section">
        <div className="container why-grid">
          <div className="why-art" aria-hidden="true">
            <div className="why-circle">
              <House size={100} strokeWidth={1} />
              <span className="why-spark">✦</span>
            </div>
            <span className="why-wordmark">CLENIX</span>
          </div>
          <div>
            <div className="eyebrow">{t("navWhy")}</div>
            <h2>{t("whyTitle")}</h2>
            <p>{t("whyBody")}</p>
            <div className="why-points">
              {["russian", "clearRates", "personal"].map((k) => (
                <span key={k}>
                  <Check size={17} />
                  {t(k)}
                </span>
              ))}
            </div>
            <Link className="text-link" href={`/${locale}/book`}>
              {t("book")}
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </div>
      </section>
      <InstagramCarousel locale={locale} posts={getInstagramPosts()} />
      <section id="faq" className="section container faq-grid">
        <div>
          <div className="eyebrow">{t("navFaq")}</div>
          <h2>{t("faqTitle")}</h2>
          <a className="text-link" href="tel:+905015284482">
            {t("call")}
            <ArrowUpRight size={18} />
          </a>
        </div>
        <div>
          {[1, 2, 3, 4, 5].map((n) => (
            <details className="faq-item" key={n}>
              <summary>
                {t(`faq${n}`)}
                <Plus size={19} />
              </summary>
              <p>{t(`faq${n}Body`)}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="container cta-wrap">
        <div className="cta">
          <div>
            <div className="eyebrow">CLENIX · ISTANBUL</div>
            <h2>{t("ctaTitle")}</h2>
            <p>{t("ctaBody")}</p>
          </div>
          <Link href={`/${locale}/book`} className="button">
            {t("book")}
            <ArrowUpRight size={21} />
          </Link>
          <span className="cta-spark" aria-hidden="true">
            ✦
          </span>
        </div>
      </section>
      <div className="sticky-mobile-cta">
        <a
          href="https://wa.me/905015284482"
          className="icon-button whatsapp-button"
          aria-label="WhatsApp: 0501 528 44 82"
          title="WhatsApp"
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={26} />
          <Phone className="whatsapp-handset" size={11} strokeWidth={2.5} />
        </a>
        <Link className="button" href={`/${locale}/book`}>
          {t("quote")}
          <ArrowUpRight size={18} />
        </Link>
      </div>
    </main>
  );
}
