const { test, expect } = require('@linebyline/test-helpers');

test('hide-secondary', async ({ page, media }) => {
  await page.keyboard.press('Control+4');
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: '📂' }).nth(1).click(),
  ]);
  await fileChooser.setFiles([
    media('plain_spanish.lrc'),
  ]);
  await page.keyboard.press('Control+5');
  await page.keyboard.press('Control+4');
  const lyrics = await page.getByRole('textbox').inputValue();
  expect(lyrics).toMatchSnapshot();
});

test('replace-secondary', async ({ page, media }) => {
  await page.keyboard.press('Control+4');
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: '📂' }).nth(1).click(),
  ]);
  await fileChooser.setFiles([
    media('plain_spanish.lrc'),
  ]);
  await fileChooser.setFiles([
    media('plain_french.lrc'),
  ]);
  const lyrics = await page.getByRole('textbox').inputValue();
  expect(lyrics).toMatchSnapshot();
});

test('paste-secondary-genius', async ({ page, readMedia }) => {
  await page.keyboard.press('Control+4');
  await page.getByRole('textbox').click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia('genius.txt'));
  await page.keyboard.press('Control+v');
  const lyrics = await page.getByRole('textbox').inputValue();
  expect(lyrics).toMatchSnapshot();
});

test('font', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('synced_english.lrc'),
  ]);
  await page.keyboard.press('Control+4');
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: '📂' }).nth(1).click(),
  ]);
  await fileChooser.setFiles([
    media('plain_spanish.lrc'),
  ]);
  const fontSelect = page.getByRole('combobox', { name: 'Editor font' });
  await fontSelect.selectOption('serif');
  for (let i = 0; i < 5; i++) await page.getByTitle('Increase font size').click();
  await expect(page).toHaveScreenshot('font-hotkey.png');
  await page.locator('#left-panel-header').click();
  await page.keyboard.press('Backquote');
  await expect(page).toHaveScreenshot('font-typing.png');
});

test('merge-one', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('synced_english.lrc'),
  ]);
  await page.keyboard.press('Control+4');
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: '📂' }).nth(1).click(),
  ]);
  await fileChooser.setFiles([
    media('plain_french.lrc'),
  ]);
  await page.keyboard.press('Control+6');
  const lines = await page.locator('#main-lines').innerText();
  expect(lines).toMatchSnapshot('merge-one-lines.txt');
  const lyrics = await page.locator('#main-textarea').inputValue();
  expect(lyrics).toMatchSnapshot('merge-one-textarea.txt');
});

test('merge-two', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('synced_english.lrc'),
  ]);
  await page.keyboard.press('Control+4');
  const [fileChooser1] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: '📂' }).nth(1).click(),
  ]);
  await fileChooser1.setFiles([
    media('plain_french.lrc'),
  ]);
  await page.keyboard.press('Control+4');
  const [fileChooser2] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: '📂' }).nth(2).click(),
  ]);
  await fileChooser2.setFiles([
    media('plain_spanish.lrc'),
  ]);
  await page.keyboard.press('Control+6');
  const lines = await page.locator('#main-lines').innerText();
  expect(lines).toMatchSnapshot('merge-two-lines.txt');
  const lyrics = await page.locator('#main-textarea').inputValue();
  expect(lyrics).toMatchSnapshot('merge-two-textarea.txt');
});

test('merge-no-timestamps', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('plain_english.lrc'),
  ]);
  await page.keyboard.press('Control+4');
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: '📂' }).nth(1).click(),
  ]);
  await fileChooser.setFiles([
    media('plain_spanish.lrc'),
  ]);
  await page.keyboard.press('Control+6');
  await expect(page).toHaveScreenshot();
});

test('merge-no-trailing', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('synced_english.lrc'),
  ]);
  await page.keyboard.press('Control+4');
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: '📂' }).nth(1).click(),
  ]);
  await fileChooser.setFiles([
    media('plain_french.lrc'),
  ]);
  await page.locator('#left-panel-header').click();
  await page.keyboard.press('Backquote');
  await page.keyboard.press('Control+End');
  await page.keyboard.down('Shift');
  for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Backspace');
  await page.keyboard.up('Shift');
  await page.keyboard.press('Control+6');
  await expect(page).toHaveScreenshot();
});

test('merge-line-mismatch', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('synced_english.lrc'),
  ]);
  await page.keyboard.press('Control+4');
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: '📂' }).nth(1).click(),
  ]);
  await fileChooser.setFiles([
    media('plain_spanish_mismatch.lrc'),
  ]);
  await page.keyboard.press('Control+6');
  await expect(page).toHaveScreenshot();
});

test('merge-block-reload', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('synced_english.lrc'),
  ]);
  await page.keyboard.press('Control+4');
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: '📂' }).nth(1).click(),
  ]);
  await fileChooser.setFiles([
    media('plain_french.lrc'),
  ]);
  await page.keyboard.press('F5');
  await expect(page).toHaveScreenshot();
});

test('reload-merge-disabled', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('synced_english.lrc'),
  ]);
  await page.keyboard.press('Control+4');
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: '📂' }).nth(1).click(),
  ]);
  await fileChooser.setFiles([
    media('plain_french.lrc'),
  ]);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Merge fields' })).toHaveScreenshot();
});