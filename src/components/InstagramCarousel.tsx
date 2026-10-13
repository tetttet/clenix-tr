"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/booking-schema";
import type { InstagramPost } from "@/lib/instagram-posts";

export default function InstagramCarousel({
  locale,
  posts,
}: {
  locale: Locale;
  posts: InstagramPost[];
}) {
  const t = useTranslations("ui");
  const [active, setActive] = useState(0);
  const count = posts.length;

  if (!count) return null;

  function move(delta: number) {
    setActive((current) => (current + delta + count) % count);
  }

  return (
    <section className="reels-section" id="reels" aria-labelledby="reels-title">
      <div className="container reels-heading">
        <div>
          <div className="eyebrow">{t("reelsEyebrow")}</div>
          <h2 id="reels-title">{t("reelsTitle")}</h2>
          <p>{t("reelsBody")}</p>
        </div>
        <Link className="text-link" href={`/${locale}/reels`}>
          {t("viewAllReels")}
          <ArrowUpRight size={19} />
        </Link>
      </div>
      <div
        className="reels-carousel"
        aria-label={t("reelsTitle")}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") move(-1);
          if (event.key === "ArrowRight") move(1);
        }}
      >
        <div className="reels-stage">
          {posts.map((post, index) => {
            let distance = (index - active + count) % count;
            if (distance > count / 2) distance -= count;
            if (Math.abs(distance) > 2) return null;
            const position =
              distance === 0
                ? "center"
                : `${distance < 0 ? "left" : "right"}-${Math.abs(distance)}`;

            return (
              <div className={`reel-card reel-card--${position}`} key={post.id}>
                <div className="reel-frame">
                  <iframe
                    src={post.embedUrl}
                    title={`${t("reelsTitle")} ${index + 1}`}
                    loading="lazy"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    tabIndex={distance === 0 ? 0 : -1}
                  />
                </div>
                <a href={post.url} target="_blank" rel="noopener noreferrer">
                  {t("openInstagram")}
                  <ArrowUpRight size={15} />
                </a>
                {distance !== 0 && (
                  <button
                    className="reel-select"
                    type="button"
                    onClick={() => setActive(index)}
                    aria-label={`${t("showReel")} ${index + 1}`}
                  />
                )}
              </div>
            );
          })}
        </div>
        <div className="reels-controls container">
          <button type="button" onClick={() => move(-1)} aria-label={t("previousReel")}>
            <ArrowLeft size={20} />
          </button>
          <span aria-live="polite">
            {String(active + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>
          <button type="button" onClick={() => move(1)} aria-label={t("nextReel")}>
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
      <div className="reels-mobile-link container">
        <Link className="button" href={`/${locale}/reels`}>
          {t("viewAllReels")}
          <ArrowUpRight size={18} />
        </Link>
      </div>
    </section>
  );
}
