import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
test('keeps approved workspace accessible, responsive and in English', async ({
  page,
  startDemo,
}, testInfo) => {
  await startDemo();
  await page.keyboard.press('Tab');
  const report = await new AxeBuilder({ page })
    .include('#main')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(report.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('html').getAttribute('lang')).toBe('en');
  await expect(page.getByText('USD 79.99').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Order ORM-1042', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('orders.png'), fullPage: true });
});
