const { test, expect } = require('@linebyline/test-helpers');

test('tab-font', async ({ page, media }) => {
  await page.keyboard.press('Backquote');
  for (let i = 0; i < 4; i++) await page.keyboard.press('Tab');
  await page.locator('#font-select').press('ArrowDown');
  await expect(page.locator('#font-select')).toHaveValue('serif');
  await expect(page.locator('#main-textarea')).toHaveScreenshot();
});

test('tab-lyrics', async ({ page, media }) => {
  await page.keyboard.press('Backquote');
  await page.keyboard.press('1');
  for (let i = 0; i < 2; i++) await page.keyboard.press('Control+4');
  for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');
  await page.keyboard.press('2');
  for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');
  await page.keyboard.press('3');
  await expect(page.locator('#main-textarea')).toHaveValue('[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n1');
  await expect(page.getByRole('textbox').nth(1)).toHaveValue('2');
  await expect(page.getByRole('textbox').nth(2)).toHaveValue('3');
});

test('tab-settings', async ({ page, media }) => {
  await page.keyboard.press('Control+,');
  for (let i = 0; i < 2; i++) await page.keyboard.press('Tab');
  await page.keyboard.press('Space');
  await expect(page.getByRole('checkbox', { name: 'Moving to previous line' })).toBeChecked();
  for (let i = 0; i < 7; i++) await page.keyboard.press('Tab'); //real user could hold to repeat
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('spinbutton', { name: 'Tiny' })).toHaveValue('99');
  await expect(page.getByText('−99ms timeZ')).toBeVisible();
  for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');
  await page.keyboard.press('&');
  await expect(page.locator('#s-default-meta')).toHaveValue('[ti: Unknown]\n[ar: Unknown]\n[al: Unknown]\n[re: https://amokprime.github.io/linebyline/]\n&');
  await page.keyboard.press('Tab');
  await page.keyboard.press('i');
  await expect(page.getByRole('textbox').nth(2)).toHaveValue('I');
  await page.keyboard.press('Enter');
  await page.keyboard.press('o');
  await expect(page.getByRole('textbox').nth(3)).toHaveValue('O');
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Backspace');
  await expect(page.getByRole('textbox').nth(2)).toHaveValue('Ctrl+;');
});