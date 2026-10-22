import { test, expect } from './fixtures';
import { fixture, requestFixture, removeFixture } from '../helpers/factories';
import { cookieNames } from '@/features/demo/cookies';
import { db } from '@/lib/prisma';
test('asks before reset and restores the demo without old requests', async ({ page, context }) => {
  const f = await fixture();
  await requestFixture(f);
  try {
    await context.addCookies(
      [cookieNames.visitor, cookieNames.demo].map((name) => ({
        name,
        value: f.token,
        url: 'http://127.0.0.1:3100',
      })),
    );
    await page.goto('/demo/reset');
    await page.getByRole('button', { name: 'Reset demonstration', exact: true }).click();
    await page.getByRole('button', { name: 'Keep my data', exact: true }).click();
    expect(await db().returnRequest.count({ where: { environmentId: f.environment.id } })).toBe(1);
    await page.getByRole('button', { name: 'Reset demonstration', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm reset', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Your orders', exact: true })).toBeVisible();
    expect(await db().returnRequest.count({ where: { environmentId: f.environment.id } })).toBe(6);
  } finally {
    await removeFixture(f);
  }
});
test('explains expired access without silently restarting', async ({ page, context }) => {
  const f = await fixture(new Date(Date.now() - 169 * 3600000));
  try {
    await context.addCookies(
      [cookieNames.visitor, cookieNames.demo].map((name) => ({
        name,
        value: f.token,
        url: 'http://127.0.0.1:3100',
      })),
    );
    await page.goto(`/customer/${f.order.customerId}/orders`);
    await expect(page.getByRole('alert').filter({ hasText: 'expired' })).toContainText('expired');
    expect(
      (await db().demoEnvironment.findUniqueOrThrow({ where: { id: f.environment.id } }))
        .generation,
    ).toBe(1);
  } finally {
    await removeFixture(f);
  }
});
