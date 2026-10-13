import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowUpRight, Camera, MessageCircle } from "lucide-react";
import { LanguageSwitcher } from "./Header";
import type { Locale } from "@/lib/booking-schema";
export default async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations("ui");
  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer-top">
          <div>
            <Link className="footer-brand" href={`/${locale}`}>
              CLENIX<span>✦</span>
            </Link>
            <p>{t("footerBody")}</p>
          </div>
          <div className="footer-links">
            <Link href={`/${locale}#services`}>{t("navServices")}</Link>
            <Link href={`/${locale}#how`}>{t("navHow")}</Link>
            <Link href={`/${locale}/reels`}>{t("navReels")}</Link>
            <Link href={`/${locale}/book`}>
              {t("book")}
              <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="footer-contact">
            <a
              href="https://wa.me/905015284482"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp: 0501 528 44 82"
            >
              <MessageCircle size={18} />
              0501 528 44 82
            </a>
            <a
              href="https://www.instagram.com/clenix_istanbul_/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Camera size={18} />
              @clenix_istanbul_
              <ArrowUpRight size={15} />
            </a>
            <span>İstanbul, Türkiye</span>
          </div>
        </div>
        <div className="footer-bottom">
          <small>
            © {new Date().getFullYear()} CLENIX. {t("rights")}
          </small>
          <div>
            <Link href={`/${locale}/privacy`}>{t("privacy")}</Link>
            <Link href={`/${locale}/terms`}>{t("terms")}</Link>
          </div>
          <LanguageSwitcher locale={locale} />
        </div>
      </div>
    </footer>
  );
}
