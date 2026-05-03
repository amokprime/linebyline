import { test, expect } from '@playwright/test';
import { findLatestVersion } from '@linebyline/test-helpers';

const latestPath = findLatestVersion();

test('has title', async ({ page }) => {
  await page.goto(latestPath);
  await expect(page).toHaveTitle(/LineByLine/);
});

test('has LineByLine favicon', async ({ page }) => {
  await page.goto(latestPath);
  const href = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(href).toContain('image/svg+xml');
  expect(href).toContain('%23ffff00');   // yellow strokes
  expect(href).toContain('%2300ff00');   // green checkmarks
});