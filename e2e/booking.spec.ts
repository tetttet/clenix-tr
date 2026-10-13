import { test, expect } from "@playwright/test";
test("deep cleaning + two AC units, back navigation and successful request", async ({
  page,
}) => {
  await page.route("**/api/bookings", async (route) => {
    const b = route.request().postDataJSON();
    expect(b.area).toBe(70);
    expect(b.acUnits).toBe(2);
    expect(b.district).toBe("Kadıköy");
    expect(b.consent).toBe(true);
    expect(b).not.toHaveProperty("total");
    await route.fulfill({ json: { success: true, reference: "CLX-E2E-MOCK" } });
  });
  await page.goto("/en");
  await page.locator("a.service-deep-cleaning").click();
  await page.getByLabel("District *", { exact: true }).selectOption("Kadıköy");
  await page
    .getByLabel("Street, building & full address")
    .fill("Test street, building 10");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(
    page.getByRole("radio", { name: /Deep \/ General Cleaning/ }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Area to clean").fill("70");
  await page.getByLabel("Add AC cleaning").check();
  await page.getByLabel("AC units *", { exact: true }).fill("");
  await expect(page.getByLabel("AC units *", { exact: true })).toBeVisible();
  await page.getByLabel("AC units *", { exact: true }).fill("2");
  await page.getByLabel("Preferred date").fill("2099-12-10");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Area to clean")).toHaveValue("70");
  await expect(page.getByLabel("AC units *", { exact: true })).toHaveValue("2");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Your name").fill("Test Customer");
  await page.getByLabel("Phone number").fill("+7 701 123 45 67");
  const summary = page.locator(".mobile-summary");
  if (await summary.isVisible()) await summary.locator("summary").click();
  await expect(page.locator(".quote-total:visible")).toContainText("5,200");
  await page.getByLabel("I have read the privacy notice").check();
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your request is on its way." }),
  ).toBeVisible();
  await expect(page.getByText("CLX-E2E-MOCK")).toBeVisible();
});
test("AC-only needs no area and API failure retains customer details", async ({
  page,
}) => {
  await page.route("**/api/bookings", (route) =>
    route.fulfill({ status: 503, json: { code: "CONFIGURATION" } }),
  );
  await page.goto("/en/book?service=ac&acUnits=2");
  await page.getByLabel("District *", { exact: true }).selectOption("Beşiktaş");
  await page
    .getByLabel("Street, building & full address")
    .fill("Test address 20");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Area to clean")).toHaveCount(0);
  await page.getByLabel("Preferred date").fill("2099-12-10");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Your name").fill("AC Customer");
  await page.getByLabel("Phone number").fill("+44 20 7946 0000");
  await page.getByLabel("I have read the privacy notice").check();
  await page.getByRole("button", { name: "Send request", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText(
    "No request has been sent",
  );
  await expect(page.getByLabel("Your name")).toHaveValue("AC Customer");
  await expect(
    page.getByRole("button", { name: "Send request", exact: true }),
  ).toBeEnabled();
});
test("step validation focuses a field and language switch preserves non-sensitive estimate", async ({
  page,
}) => {
  await page.goto("/en/book?service=renovation&area=80&acUnits=2");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.locator("#district-error")).toBeVisible();
  await expect(page.locator("#district")).toBeFocused();
  await page
    .locator("header")
    .getByRole("link", { name: "Қазақша", exact: true })
    .click();
  await expect(page).toHaveURL(
    /\/kk\/book\?service=renovation&area=80&acUnits=2/,
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "kk");
});
test("all locales, policies and responsive widths render without overflow", async ({
  page,
}) => {
  for (const locale of ["tr", "ru", "kk", "en"]) {
    await page.goto(`/${locale}`);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("h1")).not.toBeEmpty();
    await expect(page.locator(".service-card")).toHaveCount(6);
    for (const width of [360, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
    await page.goto(`/${locale}/book`);
    for (const width of [360, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
    await page.goto(`/${locale}/privacy`);
    await expect(page.locator("main")).toContainText("Telegram");
    await page.goto(`/${locale}/terms`);
    await expect(page.locator("h1")).not.toBeEmpty();
  }
});
test("mobile navigation and estimator work", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/en");
  await expect(page.locator("#quick-area")).toHaveCSS("font-size", "16px");
  await page.getByRole("button", { name: "Open menu", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "Pricing", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.locator("#quick-service").selectOption("ac");
  await page.locator("#quick-ac").fill("2");
  await expect(page.locator(".quote-total")).toContainText("1,000");
  await page
    .locator(".estimator")
    .getByRole("link", { name: "Continue", exact: true })
    .click();
  await expect(page).toHaveURL(/service=ac&acUnits=2/);
});

test("Instagram carousel cycles through videos and opens the full collection", async ({
  page,
}) => {
  await page.route("https://www.instagram.com/**", (route) =>
    route.fulfill({ contentType: "text/html", body: "<html></html>" }),
  );
  await page.goto("/ru");
  const carousel = page.locator(".reels-section");
  await expect(carousel.locator(".reel-card")).toHaveCount(5);
  await expect(carousel.locator(".reel-card--center iframe")).toHaveAttribute(
    "src",
    /Ddi7WGSs7Kp/,
  );
  await carousel.getByRole("button", { name: "Следующее видео" }).click();
  await expect(carousel.locator(".reel-card--center iframe")).toHaveAttribute(
    "src",
    /DdNuPX8MCIx/,
  );
  await carousel.getByRole("link", { name: "Смотреть все видео" }).first().click();
  await expect(page).toHaveURL(/\/ru\/reels$/);
  await expect(page.locator(".reels-grid-card")).toHaveCount(11);
});

test("booking mobile bar keeps price visible and navigates through validated steps", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/ru/book?service=ac&acUnits=2");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#district")).toHaveCSS("font-size", "16px");
  await expect(page.locator("#address")).toHaveCSS("font-size", "16px");
  const bar = page.locator(".booking-mobile-nav");
  await expect(bar).toBeVisible();
  await expect(bar.locator(".booking-mobile-price")).toContainText("1 000");
  await bar.getByRole("button", { name: "Продолжить" }).click();
  await expect(page.locator("#district-error")).toBeVisible();
  await expect(page.locator("#district option")).toHaveCount(40);
  await expect(page.locator('#district option[value="Beşiktaş"]')).toHaveText(
    "Beşiktaş",
  );
  await page.getByLabel("Район *", { exact: true }).selectOption("Beşiktaş");
  await expect(page.getByLabel("Район *", { exact: true })).toHaveValue(
    "Beşiktaş",
  );
  await page.getByLabel("Улица, дом и полный адрес").fill("Test address 20");
  await bar.getByRole("button", { name: "Продолжить" }).click();
  await expect(page.locator(".wizard-heading")).toContainText("02 / 04");
  await bar.getByRole("button", { name: "Назад" }).click();
  await expect(page.locator(".wizard-heading")).toContainText("01 / 04");
  await expect(bar.locator(".booking-mobile-price")).toContainText("1 000");
});

test("mobile submit scrolls to each missing required field", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/ru/book?service=ac&acUnits=2");
  const next = page.locator(".booking-mobile-next");
  await page.getByLabel("Район *", { exact: true }).selectOption("Beşiktaş");
  await page.getByLabel("Улица, дом и полный адрес").fill("Test address 20");
  await next.click();
  await next.click();
  await page.getByLabel("Желаемая дата").fill("2099-12-10");
  await next.click();
  await page.getByLabel("Ваше имя").fill("Test Customer");

  await next.click();
  await expect(page.locator("#phone-error")).toBeVisible();
  await expect(page.locator("#phone")).toBeFocused();

  await page.getByLabel("Номер телефона").fill("+7 701 123 45 67");
  await next.click();
  await expect(page.locator("#consent-error")).toBeVisible();
  await expect(page.locator('input[name="consent"]')).toBeFocused();
  await expect(page.locator(".consent")).toHaveClass(/consent-invalid/);
  await expect.poll(async () => {
    const box = await page.locator(".consent").boundingBox();
    return box ? box.y + box.height : Infinity;
  }).toBeLessThan(720);
  const box = await page.locator(".consent").boundingBox();
  expect(box!.y).toBeGreaterThan(100);
});

test("root redirects to Turkish and unknown pages fail gracefully", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/tr$/);
  const favicon = await request.get("/favicon.ico");
  expect(favicon.status()).toBe(200);
  const unknown = await request.get("/tr/does-not-exist");
  expect(unknown.status()).toBe(404);
  const malformed = await request.post("/api/bookings", {
    data: { consent: false },
  });
  expect(malformed.status()).toBe(422);
});
