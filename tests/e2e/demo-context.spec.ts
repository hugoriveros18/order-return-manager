import { test, expect } from './fixtures';
test('keeps customer selection and view local to each tab', async ({
  page,
  context,
  startDemo,
}) => {
  await startDemo();
  const customerUrl = page.url();
  const admin = await context.newPage();
  await admin.goto('/admin/returns');
  await expect(admin.getByRole('heading', { name: 'Return requests', exact: true })).toBeVisible();
  expect(page.url()).toBe(customerUrl);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your orders', exact: true })).toBeVisible();
});
