const { test, expect } = require('@linebyline/test-helpers');

test('title', async ({ page }) => {
  await expect(page).toHaveTitle(/LineByLine/);
});

test('favicon', async ({ page }) => {
  const href = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(href).toContain('image/svg+xml');
  expect(href).toContain('%23ffff00');   // yellow strokes
  expect(href).toContain('%2300ff00');   // green checkmarks
});

test('landing', async ({ page }) => {
  await expect(page).toHaveScreenshot();
});

test('button-tint', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Play' });
  await button.hover();
  await expect(button).toHaveScreenshot();
});

test('button-feedback', async ({ page }) => {
  const button = page.getByRole('button', { name: 'Play' });
  await button.click();
  await expect(button).toHaveScreenshot();
});