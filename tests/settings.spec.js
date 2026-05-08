const { test, expect } = require('@linebyline/test-helpers');

test('persistence', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('plain_english.lrc'),
  ]);
  await page.keyboard.press('Control+.');
  await page.reload();
  await expect(page).toHaveScreenshot();
});

test('settings-window', async ({ page, media }) => {
  await page.keyboard.press('Control+,');
  await expect(page.locator('#settings-overlay')).toHaveClass(/open/);
  await page.evaluate(() => {
    const win  = document.getElementById('settings-win');
    const body = document.getElementById('settings-body');
    win.style.maxHeight = 'none';
    win.style.overflow  = 'visible';
    body.style.overflow = 'visible';
    body.style.flex     = 'none';
  });
  await expect(page.locator('#settings-body')).toHaveScreenshot();
  await page.keyboard.press('Escape');
  await expect(page.locator('#settings-overlay')).not.toHaveClass(/open/);
});

test('search-check', async ({ page, media }) => {
  await page.keyboard.press('Control+,');
  await page.getByRole('textbox', { name: 'Search…' }).pressSequentially('Moving to n');
  for (let i = 0; i < 2; i++) await page.keyboard.press('Tab');
  await page.keyboard.press('Space');
  await expect(page.getByRole('checkbox', { name: 'Moving to next line' })).toBeChecked();
});

test('search-field', async ({ page, media }) => {
  await page.keyboard.press('Control+,');
  await page.getByRole('textbox', { name: 'Search…' }).pressSequentially('Default');
  for (let i = 0; i < 2; i++) await page.keyboard.press('Tab');
  const mdata = await page.locator('#s-default-meta').inputValue();
  await expect(mdata).toMatchSnapshot();
});

test('assign-ok-click', async ({ page, media }) => {
  await page.keyboard.press('Control+,');
  await page.getByRole('textbox', { name: 'Search…' }).pressSequentially('y/');
  await page.getByRole('textbox').nth(1).click();
  await page.keyboard.press('NumpadAdd');
  await expect(page.getByRole('textbox').nth(1)).toHaveValue('+');
});

test('assign-reserved-click', async ({ page, media }) => {
  await page.keyboard.press('Control+,');
  await page.getByRole('textbox', { name: 'Search…' }).pressSequentially('of');
  await page.locator('#hk-settings-rows').getByRole('textbox').click();
  await page.keyboard.press('Control+c');
  await expect(page.getByText('⚠ "Ctrl+C" is reserved by the')).toBeVisible();
  await expect(page.locator('#hk-settings-rows').getByRole('textbox')).toHaveValue('Shift+~');
  await page.getByRole('button', { name: '↺ Default' }).click();
  await expect(page.getByText('Hotkeys MenuOpen✕Replace↺')).toHaveScreenshot();
});

test('assign-conflict-tab', async ({ page, media }) => {
  await page.keyboard.press('Control+,');
  await page.keyboard.press('`');
  await page.keyboard.press('x');
  for (let i = 0; i < 2; i++) await page.keyboard.press('Tab');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#hk-settings-rows').getByRole('textbox')).toHaveValue('X');
  await page.keyboard.press('Tab');
  await page.keyboard.press('c');
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#hk-settings-rows').getByRole('textbox')).toHaveValue('C');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Backspace');
  await page.keyboard.press('Shift+Tab');
  await expect(page.locator('#hk-settings-rows').getByRole('textbox')).toBeEmpty();
  await page.keyboard.press('Control+Backslash');
  await page.keyboard.press('Enter');
  await page.keyboard.press('`');
  await page.keyboard.press('x');
  await expect(page.getByText('Back large amount✕Replace↺')).toBeVisible();
});