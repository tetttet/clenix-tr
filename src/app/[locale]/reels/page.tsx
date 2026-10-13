import { assertLocale } from "@/lib/locale";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/booking-schema";
import { getInstagramPosts } from "@/lib/instagram-posts";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  assertLocale(locale);
  const t = await getTranslations({ locale, namespace: "ui" });
  return pageMetadata(locale, "/reels", t("allReelsTitle"), t("allReelsBody"));
}

export default async function ReelsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  assertLocale(locale);
  setRequestLocale(locale);
  const t = await getTranslations("ui");
  const posts = getInstagramPosts();

  return (
    <main id="main" className="reels-page">
      <div className="container">
        <Link className="back-home" href={`/${locale}#reels`}>
          <ArrowLeft size={16} />
          {t("home")}
        </Link>
        <div className="reels-page-heading">
          <div className="eyebrow">{t("reelsEyebrow")}</div>
          <h1>{t("allReelsTitle")}</h1>
          <p>{t("allReelsBody")}</p>
        </div>
        <div className="reels-grid">
          {posts.map((post, index) => (
            <article className="reels-grid-card" key={post.id}>
              <div className="reel-frame">
                <iframe
                  src={post.embedUrl}
                  title={`${t("reelsTitle")} ${index + 1}`}
                  loading="lazy"
                  allow="autoplay; encrypted-media; picture-in-picture"
                />
              </div>
              <a href={post.url} target="_blank" rel="noopener noreferrer">
                {t("openInstagram")}
                <ArrowUpRight size={16} />
              </a>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
