const { test, expect } = require("@linebyline/test-helpers");

test("title", async ({ page }) => {
  await expect(page).toHaveTitle(/LineByLine/);
});

test("favicon", async ({ page }) => {
  const href = await page.locator('link[rel="icon"]').getAttribute("href");
  expect(href).toContain("image/svg+xml");
  expect(href).toContain("%23ffff00"); // yellow strokes
  expect(href).toContain("%2300ff00"); // green checkmarks
});

test("landing", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`Uncaught: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });
  // Visual snapshot
  await expect(page).toHaveScreenshot();
  // ARIA snapshot to check elements
  await expect(page.locator("body")).toMatchAriaSnapshot({
    name: "landing.yml",
  });
  // No JS errors on load
  expect(errors).toEqual([]);
  await expect(page.locator("#editor-wrapper")).toBeVisible();
  // File picker exists but is hidden
  await expect(page.locator("#file-picker")).toHaveCSS("display", "none");
});

test("button-tint", async ({ page }) => {
  const button = page.getByRole("button", { name: "Play", exact: true });
  await button.hover();
  await expect(button).toHaveScreenshot();
});

test("button-feedback", async ({ page }) => {
  const button = page.getByRole("button", { name: "Play", exact: true });
  await button.click();
  await expect(button).toHaveScreenshot();
});
