import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

test('selects the first order, shows stable refresh feedback and marks settings current', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the demo', exact: true }).click();
  const first = page.locator('a.order-option').first();
  await expect(first).toHaveAttribute('aria-current', 'true');
  await expect(first).toContainText('ORM-1045');
  await expect(page.getByRole('heading', { name: 'Order ORM-1045', exact: true })).toBeVisible();
  const refresh = page.getByRole('button', { name: 'Refresh', exact: true });
  const before = await refresh.boundingBox();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/customers/*/orders', async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await refresh.click();
    const busy = page.getByRole('button', { name: 'Refreshing…', exact: true });
    await expect(busy).toBeDisabled();
    await expect(busy).toHaveAttribute('aria-busy', 'true');
    await expect(busy.locator('.button-spinner')).toBeVisible();
    const during = await busy.boundingBox();
    expect(during!.width).toBe(before!.width);
    expect(during!.height).toBe(before!.height);
    await expect(page.getByRole('heading', { name: 'Order ORM-1045', exact: true })).toBeVisible();
  } finally {
    release();
  }
  await expect(refresh).toBeEnabled();
  await page.getByRole('link', { name: 'Demo settings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Demo settings' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Demo settings', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByText('Restore the 30-day return window.', { exact: true })).toBeVisible();
  await expect(page.getByText('Other visitors keep their data.')).toHaveCount(0);
  await page.getByRole('link', { name: 'Administrator', exact: true }).click();
  await page.getByRole('link', { name: 'Demo settings', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Demo settings', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('keeps save dimensions and stacks, dismisses and expires success/error toasts', async ({
  page,
  startDemo,
}) => {
  await startDemo();
  await page.goto('/admin/policy');
  const input = page.getByLabel('Return window in calendar days');
  await input.fill('12');
  await page.clock.install();
  const save = page.getByRole('button', { name: 'Save return window', exact: true });
  const before = await save.boundingBox();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/admin/policy', async (route) => {
    if (route.request().method() === 'PATCH') await gate;
    await route.continue();
  });
  try {
    await save.click();
    const busy = page.getByRole('button', { name: 'Saving…', exact: true });
    await expect(busy).toBeDisabled();
    await expect(busy.locator('.button-spinner')).toBeVisible();
    const during = await busy.boundingBox();
    expect(during!.width).toBe(before!.width);
    expect(during!.height).toBe(before!.height);
  } finally {
    release();
  }
  const success = page.locator('.toast').filter({ hasText: 'Return window updated.' });
  await expect(success).toBeVisible();
  await expect(page.locator('main .alert.success')).toHaveCount(0);
  await page.route('**/api/admin/policy', async (route) => {
    if (route.request().method() === 'PATCH')
      await route.fulfill({
        status: 409,
        json: { error: { code: 'CONFLICT', message: 'The policy changed. Please try again.' } },
      });
    else await route.continue();
  });
  // Submit from the field: stacking should not depend on an overlay's position.
  await input.press('Enter');
  const error = page.locator('.toast-error');
  await expect(error).toContainText('The policy changed. Please try again.');
  await expect(page.locator('.toast')).toHaveCount(2);
  await expect(input).toHaveValue('12');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
  await error.getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(error).toHaveCount(0);
  await page.mouse.move(0, 0);
  await page.clock.runFor(5100);
  await expect(page.locator('.toast')).toHaveCount(0);
});

test('separates approved instructions and keeps error toasts usable inside a modal', async ({
  page,
  startDemo,
}) => {
  await startDemo();
  const customerId = new URL(page.url()).pathname.split('/')[2];
  const response = await page.request.get(`/api/customers/${customerId}/returns`);
  const { data } = await response.json();
  const approved = data.items.find((item: { status: string }) => item.status === 'APPROVED');
  await page.goto(`/customer/${customerId}/returns/${approved.id}`);
  const heading = page.getByRole('heading', { name: 'Prepare your products', exact: true });
  await expect(heading).toBeVisible();
  await expect(heading).toHaveJSProperty('tagName', 'H3');
  const reasonBox = await page.locator('.reason-summary').boundingBox();
  const instructionBox = await page.locator('.return-instructions').boundingBox();
  expect(instructionBox!.y - reasonBox!.y - reasonBox!.height).toBeGreaterThanOrEqual(24);
  const back = page.getByRole('link', { name: 'Back to requests', exact: true });
  await expect(back.locator('svg')).toHaveCount(1);
  await back.click();
  await expect(page.getByRole('heading', { name: 'My returns', exact: true })).toBeVisible();
  await page.goto('/admin/returns');
  await page.getByRole('button', { name: /^Pending review/ }).click();
  await page.getByRole('button', { name: 'Reject', exact: true }).click();
  const modal = page.getByRole('dialog');
  await modal.getByLabel('Rejection reason').fill('Example rejection reason');
  await page.route('**/api/admin/returns/*/reject', (route) =>
    route.fulfill({
      status: 409,
      json: { error: { code: 'CONFLICT', message: 'This request has already been reviewed.' } },
    }),
  );
  await modal.getByRole('button', { name: 'Confirm rejection', exact: true }).click();
  const toast = modal.locator('.toast-error');
  await expect(toast).toContainText('This request has already been reviewed.');
  await toast.getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(toast).toHaveCount(0);
  await expect(modal).toBeVisible();
  await expect(modal.getByLabel('Rejection reason')).toHaveValue('Example rejection reason');
  await modal.getByRole('button', { name: 'Keep pending', exact: true }).click();
  await expect(modal).toHaveCount(0);
});
