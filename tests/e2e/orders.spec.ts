import { test, expect } from './fixtures';
test('shows read-only order sheets, quantities and fictional USD prices', async ({
  page,
  startDemo,
}) => {
  await startDemo();
  await expect(page.getByText('USD 319,900')).toHaveCount(0);
  await expect(page.getByText('USD 79.99').first()).toBeVisible();
  await expect(page.getByText('Quantity 2', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'Request return', exact: true })).toBeVisible();
  for (const image of await page.locator('.order-detail img').all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate(
          (i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
});
