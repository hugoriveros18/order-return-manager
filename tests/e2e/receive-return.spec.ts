import { test, expect } from './fixtures';
import { fixture, requestFixture, removeFixture } from '../helpers/factories';
import { cookieNames } from '@/features/demo/cookies';
test('shows fictional pickup instructions and confirms simulated receipt', async ({
  page,
  context,
}) => {
  const f = await fixture(),
    r = await requestFixture(f, 'APPROVED');
  try {
    await context.addCookies(
      [cookieNames.visitor, cookieNames.demo].map((name) => ({
        name,
        value: f.token,
        url: 'http://127.0.0.1:3100',
      })),
    );
    await page.goto(`/customer/${f.order.customerId}/returns/${r.id}`);
    await expect(page.getByText(/next three business days/)).toBeVisible();
    await expect(page.getByText(/No real carrier/)).toBeVisible();
    await page.goto(`/admin/returns/${r.id}`);
    await page.getByRole('button', { name: 'Confirm simulated receipt', exact: true }).click();
    await expect(
      page.locator('section.sheet').getByText('Return received', { exact: true }),
    ).toBeVisible();
  } finally {
    await removeFixture(f);
  }
});
