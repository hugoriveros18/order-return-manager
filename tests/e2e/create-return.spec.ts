import { test, expect } from './fixtures';
test('creates a partial return after reviewing the selected quantity and reason', async ({
  page,
  startDemo,
}) => {
  await startDemo();
  await page.getByRole('link', { name: 'Request return', exact: true }).click();
  await page
    .getByRole('button', { name: /^Add .* to return$/ })
    .first()
    .click();
  await page.getByLabel('Return reason').fill('The keyboard does not fit my workspace.');
  await page.getByRole('button', { name: 'Review request', exact: true }).click();
  await page.getByRole('button', { name: 'Create request', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Return request created' })).toBeVisible();
});
