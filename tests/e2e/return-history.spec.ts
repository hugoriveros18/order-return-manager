import { test, expect } from './fixtures';
import { fixture, requestFixture, removeFixture } from '../helpers/factories';
import { cookieNames } from '@/features/demo/cookies';
test('shows rejection reason and uneditable customer/admin history', async ({ page, context }) => {
  const f = await fixture(),
    r = await requestFixture(f, 'REJECTED');
  try {
    await context.addCookies(
      [cookieNames.visitor, cookieNames.demo].map((name) => ({
        name,
        value: f.token,
        url: 'http://127.0.0.1:3100',
        httpOnly: true,
      })),
    );
    await page.goto(`/customer/${f.order.customerId}/returns/${r.id}`);
    await expect(page.getByRole('heading', { name: 'History', exact: true })).toBeVisible();
    await expect(page.getByText('Outside demo condition').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Edit history' })).toHaveCount(0);
  } finally {
    await removeFixture(f);
  }
});
