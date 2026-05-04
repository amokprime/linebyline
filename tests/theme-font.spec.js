import { test, expect } from '@playwright/test';
import { findLatestVersion } from '@linebyline/test-helpers';
const latestPath = findLatestVersion();

test('link-hrefs', async ({ page }) => {
  await page.goto(latestPath);
  await expect(page.getByRole('link', { name: '?' })).toHaveAttribute(
    'href', 'https://github.com/amokprime/linebyline/blob/main/HELP.md'
  );
  await expect(page.getByRole('link', { name: 'Issues (Ctrl+[)' })).toHaveAttribute(
    'href', 'https://github.com/amokprime/linebyline/issues'
  );
});

test('theme-toggle', async ({ page }) => {
  await page.goto(latestPath);
  await page.keyboard.press('Control+.')
  await expect(page).toHaveScreenshot('dark-mode.png');
  await page.keyboard.press('Control+.')
  await expect(page).toHaveScreenshot('light-mode.png');
});

test('font-toggle', async ({ page }) => {
  await page.goto(latestPath);
  const fontSelect = page.getByRole('combobox', { name: 'Editor font' });
  await expect(fontSelect).toHaveValue('system-ui,sans-serif');
  await fontSelect.selectOption('serif');
  await expect(fontSelect).toHaveValue('serif');
  await fontSelect.selectOption('system-ui,sans-serif');
  await expect(fontSelect).toHaveValue('system-ui,sans-serif');
});

test('font-size', async ({ page }) => {
  await page.goto(latestPath);
  await expect(page.getByRole('spinbutton', { name: 'Font size' })).toHaveValue('14');
  await page.getByTitle('Increase font size').click();
  await expect(page.getByRole('spinbutton', { name: 'Font size' })).toHaveValue('15');
  await page.getByTitle('Decrease font size').click();
  await expect(page.getByRole('spinbutton', { name: 'Font size' })).toHaveValue('14');
});