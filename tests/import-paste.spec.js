const { test, expect } = require('@linebyline/test-helpers');

test('import audio + plain lyrics', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('plain_english.lrc'),
  ]);
    await expect(page.getByText('audio')).toBeVisible();
    await expect(page.locator('#main-lines')).toContainText('I wish I could');
});

test('import audio + synced lyrics', async ({ page, media }) => {
  await page.locator('#file-picker').setInputFiles([
    media('audio.mp3'),
    media('synced_english.lrc'),
  ]);
    await expect(page.getByText('I Wish I Could Identify That Smell', { exact: true })).toBeVisible();
    await expect(page.locator('#main-lines')).toContainText('[00:00.00] I wish I could');
});