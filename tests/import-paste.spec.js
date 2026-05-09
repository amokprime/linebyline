const { test, expect } = require('@linebyline/test-helpers');

test('import-plain', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('plain_english.lrc'),
  ]);
    await expect(page.getByText('audio')).toBeVisible();
    const lines = await page.locator('#main-lines').innerText();
    expect(lines).toMatchSnapshot('import-plain-lines.txt');
    const lyrics = await page.locator('#main-textarea').inputValue();
    expect(lyrics).toMatchSnapshot('import-plain-textarea.txt');
});

test('import-synced', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('synced_english.lrc'),
  ]);
    await expect(page.getByText('I Wish I Could Identify That Smell', { exact: true })).toBeVisible();
    await expect(page.getByText('The Jazz Kissingers')).toBeVisible();
    const lines = await page.locator('#main-lines').innerText();
    expect(lines).toMatchSnapshot('import-synced-lines.txt');
    const lyrics = await page.locator('#main-textarea').inputValue();
    expect(lyrics).toMatchSnapshot('import-synced-textarea.txt');
});

test('import-replace', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('synced_english.lrc'),
  ]);
  await page.locator('#file-picker').setInputFiles([
    media('plain_english.lrc'),
  ]);
    await expect(page.getByText('audio')).toBeVisible();
    const lines = await page.locator('#main-lines').innerText();
    expect(lines).toMatchSnapshot('import-replace-lines.txt');
    const lyrics = await page.locator('#main-textarea').inputValue();
    expect(lyrics).toMatchSnapshot('import-replace-textarea.txt');
});

test('paste-plain-hotkey', async ({ page, readMedia }) => {
  await page.locator('#main-lines').click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia('plain_english.lrc'));
  await page.keyboard.press('Control+v');
    const lines = await page.locator('#main-lines').innerText();
    expect(lines).toMatchSnapshot('paste-plain-hotkey-lines.txt');
});

test('paste-synced-hotkey', async ({ page, readMedia }) => {
  await page.locator('#main-lines').click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia('synced_english.lrc'));
  await page.keyboard.press('Control+v');
    const lines = await page.locator('#main-lines').innerText();
    expect(lines).toMatchSnapshot();
});

test('paste-plain-typing', async ({ page, readMedia }) => {
  await page.keyboard.press('Backquote')
  await page.locator('#main-textarea').click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia('plain_english.lrc'));
  await page.keyboard.press('Control+v');
  const lyrics = await page.locator('#main-textarea').inputValue();
  expect(lyrics).toMatchSnapshot();
});

test('paste-synced-typing', async ({ page, readMedia }) => {
  await page.keyboard.press('Backquote')
  await page.locator('#main-textarea').click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia('synced_english.lrc'));
  await page.keyboard.press('Control+v');
  const lyrics = await page.locator('#main-textarea').inputValue();
  expect(lyrics).toMatchSnapshot();
});

test('paste-secondary', async ({ page, readMedia }) => {
  await page.keyboard.press('Control+4');
  await page.getByRole('textbox').click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia('plain_french.lrc'));
  await page.keyboard.press('Control+v');
  const lyrics = await page.getByRole('textbox').inputValue();
  expect(lyrics).toMatchSnapshot();
});

test('paste-genius-hotkey', async ({ page, readMedia }) => {
  await page.locator('#main-lines').click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia('mock.txt'));
  await page.keyboard.press('Control+v');
  const lyrics = await page.locator('#main-textarea').inputValue();
  expect(lyrics).toMatchSnapshot();
});

test('paste-genius-typing', async ({ page, readMedia }) => {
  await page.keyboard.press('Backquote')
  await page.locator('#main-textarea').click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, readMedia('mock.txt'));
  await page.keyboard.press('Control+v');
  const lyrics = await page.locator('#main-textarea').inputValue();
  expect(lyrics).toMatchSnapshot();
});

test('10k-line-paste', async ({ page }) => {
  const longText = Array(10000).fill('I wish I could identify that smell').join('\n');
  await page.locator('#main-lines').click();
  await page.evaluate((text) => {
    navigator.clipboard.writeText(text);
  }, longText);
  await page.keyboard.press('Control+v');
  await expect(page.locator('#main-lines')).toContainText('I wish I could');
});

test('naughty-strings', async ({ page, readMedia }) => {
  test.setTimeout(120000);
  const blns = JSON.parse(readMedia('naughty-strings.json'));
  await page.locator('#main-lines').click();
  for (const naughty of blns) {
    await page.evaluate((text) => {
      navigator.clipboard.writeText(text);
    }, naughty);
    await page.keyboard.press('Control+v');
    await expect(page.locator('#main-lines')).toBeVisible();
  }
});