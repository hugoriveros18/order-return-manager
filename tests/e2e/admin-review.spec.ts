import { test, expect } from './fixtures';
test('provides a scoped review queue and distinct policy navigation', async ({
  page,
  startDemo,
}) => {
  await startDemo();
  await page.getByRole('link', { name: 'Administrator', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Return requests', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return policy', exact: true })).toBeVisible();
  await expect(page.locator('.request-queue .queue-item')).toHaveCount(6);
  await expect(page.getByLabel('2 pending requests')).toBeVisible();
});
