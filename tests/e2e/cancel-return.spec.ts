import { test, expect } from './fixtures';
import { fixture, requestFixture, removeFixture } from '../helpers/factories';
import { cookieNames } from '@/features/demo/cookies';
test('declines then confirms cancellation of a pending return', async ({ page, context }) => {
  const f = await fixture(),
    r = await requestFixture(f);
  try {
    await context.addCookies(
      [cookieNames.visitor, cookieNames.demo].map((name) => ({
        name,
        value: f.token,
        url: 'http://127.0.0.1:3100',
      })),
    );
    await page.goto(`/customer/${f.order.customerId}/returns/${r.id}`);
    await page.getByRole('button', { name: 'Cancel request', exact: true }).click();
    await page.getByRole('button', { name: 'Keep request', exact: true }).click();
    await expect(page.getByText('Pending review', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel request', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm cancellation', exact: true }).click();
    await expect(page.getByText('Cancelled', { exact: true })).toBeVisible();
  } finally {
    await removeFixture(f);
  }
});
