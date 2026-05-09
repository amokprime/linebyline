const { test, expect } = require('@linebyline/test-helpers');
import AxeBuilder from '@axe-core/playwright';

test('axe-scan', async ({ page }) => {
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});