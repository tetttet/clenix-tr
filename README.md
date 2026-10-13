# CLENIX Istanbul

A complete four-language cleaning inquiry website built with Next.js 16 App Router, React, strict TypeScript, next-intl, Tailwind CSS, React Hook Form, Zod and accessible Radix dialog / native form controls. Turkish is the default; Russian, Kazakh and English have complete dictionaries. The supplied original logo is installed at `public/brand/clenix-logo.jpg`, displayed in a circular frame. The room illustration is original SVG, not a photograph of CLENIX work. Manrope is self-hosted with Latin, Cyrillic and extended character subsets.

## Local start

Use **Node 24 LTS** (see `.nvmrc`) and npm. The host used for initial development had Node 23; current dependencies target supported LTS releases.

```sh
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. `/` redirects to `/tr`. Routes: `/{tr,ru,kk,en}`, `/{locale}/book`, `/{locale}/privacy`, `/{locale}/terms`. Dependencies are pinned and the lockfile is committed-ready. `.npmrc` selects the alternate peer resolver because npm 11.3's resolver crashed when scaffolding this combination.

With **no Telegram credentials**, the complete UI, estimator and validation work. Submitting returns a localized configuration error (HTTP 503); nothing is sent and no success is fabricated. There is no mock delivery mode in the application. Automated tests explicitly mock upstream Telegram or intercept the browser API; production cannot enable those mocks.

## Environment

Set variables in `.env.local` for local use, or Vercel → Project → Settings → Environment Variables for deployment. `.env*` is ignored except `.env.example`.

| Variable                     | Purpose                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `TELEGRAM_BOT_TOKEN`         | Required server-only bot token                                                                                 |
| `TELEGRAM_CHAT_ID`           | Required negative group chat ID; personal chat IDs are rejected                                                |
| `TELEGRAM_MESSAGE_THREAD_ID` | Optional positive integer topic ID for a forum group                                                           |
| `NEXT_PUBLIC_SITE_URL`       | Full public origin, e.g. your actual production Vercel URL; used for canonical URLs, sitemap and origin checks |
| `UPSTASH_REDIS_REST_URL`     | Optional Redis REST URL; recommended for production                                                            |
| `UPSTASH_REDIS_REST_TOKEN`   | Optional Redis REST token; server-only                                                                         |

Without an explicit site URL, SEO uses Vercel's production URL when available, otherwise localhost for development. Set the final production origin and rebuild after assigning a custom domain. Never put tokens or chat IDs in `NEXT_PUBLIC_*`, source files, screenshots or logs. No public WhatsApp or Telegram link is claimed.

## Telegram setup and a live test

1. In Telegram, contact the official **@BotFather**, run `/newbot`, follow the prompts and copy the bot token to your server environment.
2. Add the bot to the destination group and permit it to send messages. Send a command mentioning the bot in that group so it receives an update.
3. Retrieve `getUpdates` privately from Telegram's API to identify `message.chat.id`. A topic message also provides `message_thread_id`. Do not paste the token into tickets, code or this README. Avoid browser URLs containing tokens because history records them. The helper below prompts for the token without echoing or placing it in shell history:

   ```sh
   python3 scripts/telegram-chat-id.py
   ```

   The helper prints only chat IDs, titles/types and thread IDs; it does not print messages, phone numbers, token or raw API responses. `getUpdates` cannot work while a webhook is configured; use the bot's existing administration process if that applies. This helper does not alter webhooks.

4. Set `TELEGRAM_BOT_TOKEN`, the group's negative `TELEGRAM_CHAT_ID`, and optionally `TELEGRAM_MESSAGE_THREAD_ID`; restart the local server or update the deployed environment and redeploy. A positive personal chat ID returns a configuration error without sending a message.
5. Open `/en/book?service=deep-cleaning&area=70&acUnits=2`. Supply an address you are authorized to share, a future preferred date, your contact information and acknowledgement. Submit once.
6. Verify the operator receives the message with **70 × 60 + 2 × 500 = 5,200 TRY starting estimate**, the district/address/contact, notes, date/time, locale and request reference. Check that the UI reports a **request sent**, not an appointment confirmed. Live delivery is not verified until this step is performed with business credentials.

Telegram reference: https://core.telegram.org/bots/api#sendmessage and https://core.telegram.org/bots/tutorial.

## Deploy to Vercel

1. Review the source, initialize a Git repository if needed (`git init`), add and commit the project, and push to a GitHub repository you control. Never add `.env.local`.
2. In Vercel, **Add New → Project → Import** that repository. Framework: **Next.js**. Root directory: this project. Node.js: **24.x**. Install: `npm ci`; build: `npm run build`; use the default Next.js output settings (not a static export).
3. Add the required server environment variables. Set `NEXT_PUBLIC_SITE_URL` to the assigned production URL. Add optional Upstash values for shared rate limiting and duplicate protection. Enable the values for the intended deployment environments; avoid routing preview test inquiries to a live operations chat unintentionally.
4. Deploy. If assigning a custom domain or changing any environment values, update the URL and redeploy.
5. Open every locale, review the privacy/terms copy for the actual operating arrangements, then send the live test above and check the operator chat. API requests execute as Node serverless functions with a 30-second maximum duration and a 10-second Telegram timeout.

No hosting publication or live Telegram message is performed automatically by this repository. No database, paid service or long-lived server is required for basic operation.

## Pricing and validation

- Canonical rates: `src/lib/services.ts`. Deep/general **60 ₺/m²**; maintenance **50 ₺/m²**; renovation **90 ₺/m²**; after tenants **70 ₺/m²**; after disinfection **70 ₺/m²**; AC **500 ₺/unit**.
- Deterministic arithmetic: `src/lib/pricing.ts`. `area × rate + AC units × 500`. Area is constrained to **10–20,000 m²**, with at most **one decimal place**. This yields exact whole-TRY totals for every stated rate, with no hidden rounding. These bounds are validation constraints, never pricing tiers. AC-only ignores area and requires 1–100 units. Optional AC extras allow 0–100 units.
- Schema: `src/lib/booking-schema.ts`; all 39 districts: `src/lib/districts.ts`. Date validation uses **Europe/Istanbul**, not the server's local day. International phones permit 7–15 digits and common formatting. Address, names and notes are length-limited. Optional counts are 0–100.
- Location, property, dirt and furnishing **never alter the numeric quote**. Other special requests are notes only and require operator confirmation.
- The server drops submitted `total`, `price`, and `estimate`, rejects other unexpected keys, and recalculates all amounts. AC-only strips area before delivery. Inactive Telegram usernames are not delivered.
- `messages/{tr,ru,kk,en}.json` contains all customer copy, including errors, policies and SEO. Service IDs and rates are never translated or duplicated there.

## Security, privacy and delivery semantics

`POST /api/bookings` validates JSON content type, same-origin browser requests, a **16 KiB streamed body limit**, schema, consent and honeypot. It escapes every user-controlled Telegram HTML line, never sends PII to client logs, checks HTTP success **and** Telegram `ok: true`, and returns only safe codes/reference. There are no analytics, unnecessary cookies, PII browser persistence, or customer database. The locale cookie is essential. Telegram and hosting provider retention are disclosed in the editable privacy notice.

The client guards simultaneous submission and uses a request UUID retained in component memory. Server idempotency claims bind that UUID to a payload fingerprint. Successful retries return the original reference. Concurrent or uncertain submissions are held for **24 hours**, avoiding an automatic duplicate if Telegram accepted a request just before a timeout. An explicit Telegram `ok: false` releases the claim so the customer can safely retry; ambiguous network failures retain it. No automatic Telegram retries occur. If delivery is uncertain, contact CLENIX before making another request. Exactly-once delivery cannot be guaranteed across an external API and serverless state; there is no transaction with Telegram. Reloading or opening another tab creates another request ID.

With Upstash, atomic Lua rate limiting permits **5 attempts per 10-minute window** per hashed client IP. Atomic `SET NX EX` claims requests across instances. Only hashed identifiers/fingerprints, status and reference are stored, with TTLs. Configure **both** Redis variables together. Redis outages fail closed before delivery. On Vercel, the trusted `x-vercel-forwarded-for` header is preferred. On another hosting provider, configure a trusted reverse proxy that overwrites forwarded IP headers.

Without Redis, in-memory protection is **best effort per process**, not persistent serverless protection. It is useful locally but cannot coordinate Vercel instances or survive restarts. The site still functions without third-party spam keys. Turnstile is not implemented or required; no misleading unused Turnstile environment variables are provided. Production operators should enable shared protection or equivalent platform firewall controls as appropriate.

## Verification

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npx playwright install chromium
npm run test:e2e
```

Vitest covers all six rates, decimal arithmetic, AC-only, malformed fields, complete locale keys, escaping, HTTP handling, size bounds, configuration errors, failed upstream responses, idempotency and server recomputation. Playwright starts the production server on port 3000 (or reuses it), runs desktop/mobile booking flows, verifies back navigation, mocked success/failure, AC-only behavior, language choices, policies and 360/768/1440px overflow checks. All test data is synthetic. No test sends a real Telegram notification.

The original supplied `clenix.jpg` and build brief are preserved. To replace the logo later, put the approved original at `public/brand/clenix-logo.jpg`; update `Header.tsx` and SEO image paths if changing its extension. Branding tokens are in `src/app/globals.css` and the authored room illustration is `src/components/RoomIllustration.tsx`.

## Dependency audit note

The production dependency audit (`npm audit --omit=dev`) reports **0 vulnerabilities**. The full audit currently reports five high-severity entries in the development-only Next.js ESLint → fast-glob → micromatch → braces chain, stemming from a nested-pattern denial-of-service advisory. No patched compatible braces release was offered by npm at verification time. Lint only trusted source paths; monitor upstream patches. The suggested automatic fix would downgrade the Next.js lint configuration to a different major version and is deliberately not applied. The initially flagged older Vitest dependencies were upgraded to current patched releases.

## Verification record — 13 October 2026

- `npm run lint`: passed without warnings.
- `npm run typecheck`: passed.
- `npm run test`: **65 passed**, across five suites.
- `npm run build`: passed; four homepages and eight policy pages prerendered, booking/API routes server-rendered.
- `npm run test:e2e`: **12 passed**, Chromium desktop and mobile. Includes combined-service success, AC-only, failure preservation, input focus, locale switching, responsive homepage/booking layouts, menu, estimator, root redirect, favicon, 404 and malformed API input.
- Visually inspected the desktop English and 360px Turkish homepage. Responsive overflow checks cover every locale at 360, 768 and 1440px. Text contrast checked for primary/muted text, large secondary headings and yellow/navy actions; muted indices and placeholders were darkened.
- Production dependency audit: **0 vulnerabilities**. Development-only advisories are described above. No Telegram endpoint or secret variable names were found in the generated client JavaScript.
- No live Telegram credentials were supplied or used. Live Telegram acceptance and a Vercel deployment remain external configuration/verification steps.
