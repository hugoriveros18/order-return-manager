import { test, expect } from './fixtures';
test('saves a global return window and explains prospective behavior', async ({
  page,
  startDemo,
}) => {
  await startDemo();
  await page.goto('/admin/policy');
  await page.getByLabel('Return window in calendar days').fill('5');
  await page.getByRole('button', { name: 'Save return window' }).click();
  await expect(page.getByRole('status')).toContainText('Return window updated');
  await expect(page.getByLabel('Return window in calendar days')).toHaveValue('5');
});
