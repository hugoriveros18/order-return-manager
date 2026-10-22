import { test as base, expect } from '@playwright/test';
export const test = base.extend<{ startDemo: () => Promise<void> }>({
  startDemo: async ({ page }, provide) => {
    await provide(async () => {
      await page.goto('/');
      await page.getByRole('button', { name: 'Explore the demo', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Your orders', exact: true })).toBeVisible();
      await page.locator('a.order-option').filter({ hasText: 'ORM-1042' }).click();
      await expect(page).toHaveURL(/\/orders\?order=[a-f0-9-]+$/);
      await expect(
        page.getByRole('heading', { name: 'Order ORM-1042', exact: true }),
      ).toBeVisible();
    });
  },
});
export { expect };
