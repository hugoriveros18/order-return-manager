import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
test('reuses order data, keeps role controls fixed and supports the styled customer picker', async ({
  page,
  startDemo,
}) => {
  let loads = 0;
  page.on('request', (r) => {
    if (/\/api\/customers\/[^/]+\/orders(?:\?|$)/.test(r.url())) loads++;
  });
  await startDemo();
  const before = await page.locator('.order-detail').boundingBox();
  await page.locator('a.order-option').filter({ hasText: 'ORM-1043' }).click();
  await expect(page.getByRole('heading', { name: 'Order ORM-1043', exact: true })).toBeVisible();
  const after = await page.locator('.order-detail').boundingBox();
  expect(after!.y).toBe(before!.y);
  expect(loads).toBe(1);
  const roleBefore = await page.getByRole('group', { name: 'Demonstration view' }).boundingBox();
  await page.getByRole('link', { name: 'Administrator', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Return requests', exact: true })).toBeVisible();
  const roleAfter = await page.getByRole('group', { name: 'Demonstration view' }).boundingBox();
  expect(roleAfter!.x).toBe(roleBefore!.x);
  expect(roleAfter!.width).toBe(roleBefore!.width);
  await page.getByRole('link', { name: 'Demo settings' }).click();
  await expect(
    page.getByText('You’re in Administrator view. Settings keep you in this view.'),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Customer', exact: true }).click();
  await page.getByRole('button', { name: 'Select customer' }).click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Your orders', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Select customer' })).toContainText('Jordan Lee');
});
test('supports dark appearance, live pending counts and dismissible required-reason dialogs', async ({
  page,
  startDemo,
}, info) => {
  await startDemo();
  for (const dark of [true, false]) {
    await page
      .getByRole('button', { name: dark ? 'Switch to dark mode' : 'Switch to light mode' })
      .click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', dark ? 'dark' : 'light');
    await page.evaluate(() =>
      Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))),
    );
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: info.outputPath(dark ? 'orders-dark.png' : 'orders-light.png'),
      fullPage: true,
    });
  }
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('link', { name: 'Administrator', exact: true }).click();
  await expect(page.getByLabel('2 pending requests')).toBeVisible();
  await page.getByRole('button', { name: 'Approve request', exact: true }).click();
  await expect(page.getByLabel('1 pending requests')).toBeVisible();
  await page.getByRole('button', { name: /^Pending review/ }).click();
  await page.getByRole('button', { name: 'Reject', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel(/Rejection reason/)).toHaveAttribute('required', '');
  await page.mouse.click(4, 4);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByLabel('1 pending requests')).toBeVisible();
  await page.getByRole('button', { name: 'Reject', exact: true }).click();
  await page
    .getByLabel(/Rejection reason/)
    .fill('This demonstration request does not meet the condition policy.');
  await page.getByRole('button', { name: 'Confirm rejection' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.nav-count')).toHaveCount(0);
});
