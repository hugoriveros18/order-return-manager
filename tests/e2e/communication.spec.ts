import { test, expect } from './fixtures';
import { fixture, requestFixture, removeFixture } from '../helpers/factories';
import { cookieNames } from '@/features/demo/cookies';
import type { ReturnView } from '@/lib/contracts';

const retired = [
  'Your own fictional workspace.',
  'Original purchase prices in USD. All products and orders are fictional.',
  'Demonstration only. No real refunds, shipments or pickups.',
];

test('keeps demo identity on direct entry while routine screens focus on the task', async ({
  page,
  context,
  startDemo,
}) => {
  test.setTimeout(90000);
  await page.goto('/');
  await expect(page.locator('.demo-label')).toHaveText('Demo');
  await expect(page.getByText('No account needed.', { exact: true })).toBeVisible();
  await startDemo();
  const customerId = new URL(page.url()).pathname.split('/')[2];
  const data = await (await context.request.get('/api/admin/returns')).json();
  const pending = (data.data.items as ReturnView[]).find((r) => r.status === 'PENDING')!;
  const routes = [
    `/customer/${customerId}/orders`,
    `/customer/${customerId}/returns`,
    `/admin/returns/${pending.id}`,
    `/demo/guide?view=admin&customer=${customerId}`,
    `/demo/reset?view=admin&customer=${customerId}`,
  ];
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => localStorage.setItem('orm-theme', value), theme);
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('.demo-label')).toBeVisible();
      await expect(page.locator('.demo-label')).toHaveCount(1);
      await expect(page.locator('.demo-notice,.rail-note')).toHaveCount(0);
      for (const text of retired)
        await expect(page.getByText(text, { exact: true })).toHaveCount(0);
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  }
  await page.getByRole('button', { name: 'Reset demonstration', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('This cannot be undone.');
  await page.getByRole('button', { name: 'Keep my data' }).click();
  await page.goto(`/customer/${customerId}/orders`);
  await page.getByRole('button', { name: 'Select customer', exact: true }).click();
  await expect(page.getByRole('listbox', { name: 'Customer', exact: true })).toBeVisible();
  await expect(page.getByRole('option').first()).not.toContainText('Demo profile');
  await page.keyboard.press('Escape');
});

test('retains action-specific consequences on direct request links without visiting help', async ({
  page,
  context,
}) => {
  test.setTimeout(90000);
  for (const status of ['PENDING', 'APPROVED', 'RECEIVED'] as const) {
    const f = await fixture();
    try {
      const request = await requestFixture(f, status);
      await context.addCookies(
        [cookieNames.visitor, cookieNames.demo].map((name) => ({
          name,
          value: f.token,
          url: 'http://127.0.0.1:3100',
        })),
      );
      await page.goto(`/admin/returns/${request.id}`);
      await expect(page.locator('.demo-label')).toBeVisible();
      await expect(page.locator('.request-detail h2').first()).toHaveText(request.displayNumber);
      if (status === 'PENDING') {
        await expect(page.locator('.approval-note')).toHaveCount(1);
        await expect(page.locator('.approval-note')).toContainText(
          'does not issue a refund or confirm physical receipt',
        );
        await expect(page.getByRole('button', { name: 'Approve request' })).toBeVisible();
      } else {
        await expect(page.locator('.approval-note')).toHaveCount(0);
        await expect(page.locator('.return-instructions')).toHaveCount(1);
        await expect(page.locator('.return-instructions')).toContainText(
          status === 'APPROVED'
            ? 'receipt confirmation does not issue a refund'
            : 'No refund has been issued',
        );
      }
      if (status !== 'PENDING') {
        await page.goto(`/customer/${f.order.customerId}/returns/${request.id}`);
        const panel = page.locator('.return-instructions');
        await expect(panel).toHaveCount(1);
        if (status === 'APPROVED') {
          await expect(panel).toContainText('next three business days');
          await expect(panel).toContainText('No real carrier will be sent');
          await expect(panel).toContainText(
            'Approval does not issue a refund or confirm physical receipt',
          );
        } else await expect(panel).toContainText('No refund has been issued');
      }
    } finally {
      await removeFixture(f);
    }
  }
});
