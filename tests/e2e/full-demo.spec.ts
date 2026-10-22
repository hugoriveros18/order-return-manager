import { test, expect } from './fixtures';
test('completes customer creation, administrator approval, receipt and customer history across tabs', async ({
  page,
  context,
  startDemo,
}) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://127.0.0.1:3100') && !r.url().startsWith('data:'))
      external.push(r.url());
  });
  await startDemo();
  await page.getByRole('link', { name: 'Request return', exact: true }).click();
  await page
    .getByRole('button', { name: /^Add .* to return$/ })
    .first()
    .click();
  await page.getByLabel('Return reason').fill('The product does not fit my workspace.');
  await page.getByRole('button', { name: 'Review request', exact: true }).click();
  await page.getByRole('button', { name: 'Create request', exact: true }).click();
  await page.getByRole('link', { name: 'View request', exact: true }).click();
  await expect(page).toHaveURL(/\/returns\/[a-f0-9-]{36}$/);
  await expect(page.getByText('Pending review', { exact: true })).toBeVisible();
  const url = page.url(),
    id = url.split('/').pop()!;
  const admin = await context.newPage();
  await admin.goto(`/admin/returns/${id}`);
  await admin.getByRole('button', { name: 'Approve request', exact: true }).click();
  await expect(
    admin.locator('section.sheet').getByText('Approved — awaiting pickup', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Prepare your products' })).toBeVisible();
  await admin.getByRole('button', { name: 'Confirm simulated receipt', exact: true }).click();
  await expect(
    admin.locator('section.sheet').getByText('Return received', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Simulated receipt confirmed', exact: true }),
  ).toBeVisible();
  await expect(page.locator('ol.timeline li')).toHaveCount(3);
  expect(external).toEqual([]);
});
test('keeps browser-context data isolated and supports complete-request rejection', async ({
  page,
  browser,
  startDemo,
}) => {
  await startDemo();
  await page.getByRole('link', { name: 'Request return', exact: true }).click();
  await page.getByRole('button', { name: 'Select all available units' }).click();
  await page.getByLabel('Return reason').fill('Full return demonstration.');
  await page.getByRole('button', { name: 'Review request' }).click();
  await page.getByRole('button', { name: 'Create request', exact: true }).click();
  await page.getByRole('link', { name: 'View request', exact: true }).click();
  await expect(page).toHaveURL(/\/returns\/[a-f0-9-]{36}$/);
  const url = page.url(),
    id = url.split('/').pop()!;
  const other = await browser.newContext();
  try {
    const tab = await other.newPage();
    await tab.goto('/');
    await tab.getByRole('button', { name: 'Explore the demo', exact: true }).click();
    await expect(tab.getByRole('heading', { name: 'Your orders', exact: true })).toBeVisible();
    await tab.goto(url);
    await expect(tab.getByRole('alert').filter({ hasText: 'not available' })).toBeVisible();
  } finally {
    await other.close();
  }
  await page.goto(`/admin/returns/${id}`);
  await page.getByRole('button', { name: 'Reject', exact: true }).click();
  await page.getByLabel('Rejection reason').fill('Demonstration review reason.');
  await page.getByRole('button', { name: 'Confirm rejection' }).click();
  await expect(page.locator('section.sheet').getByText('Rejected', { exact: true })).toBeVisible();
  await expect(
    page.locator('section.sheet').getByText('Demonstration review reason.').first(),
  ).toBeVisible();
});
