import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';

const names = [
  'Pending review',
  'Approved — awaiting pickup',
  'Return received',
  'Rejected',
  'Cancelled',
];

test('explains the canonical state map with readable connectors in both themes', async ({
  page,
  startDemo,
}, info) => {
  test.setTimeout(120000);
  await startDemo();
  await page.getByRole('link', { name: 'How returns work', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'The complete picture' })).toBeVisible();
  const writes: string[] = [];
  page.on('request', (request) => {
    if (request.method() !== 'GET') writes.push(request.url());
  });
  await expect(page.locator('.guide-state')).toHaveCount(5);
  expect(
    await page
      .locator('.guide-transition')
      .evaluateAll((elements) =>
        elements
          .map(
            (element) => `${element.getAttribute('data-from')}:${element.getAttribute('data-to')}`,
          )
          .sort(),
      ),
  ).toEqual(['APPROVED:RECEIVED', 'PENDING:APPROVED', 'PENDING:CANCELLED', 'PENDING:REJECTED']);
  for (const name of names) {
    const state = page.getByRole('button', { name: `Learn about ${name}`, exact: true });
    await state.focus();
    await page.keyboard.press('Enter');
    await expect(state).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.guide-explanation h3')).toHaveText(`${name} — what it means`);
    await expect(page.locator('.guide-explanation')).toHaveAttribute('aria-live', 'polite');
  }
  await page.getByRole('button', { name: 'Learn about Rejected', exact: true }).click();
  await expect(page.locator('.guide-explanation')).toContainText('must provide a reason');
  await page.getByRole('button', { name: 'Learn about Return received', exact: true }).click();
  await expect(page.locator('.guide-explanation')).toContainText('never automatic');
  await expect(page.locator('.guide-explanation')).toContainText('units remain committed');
  const widths = info.project.name === 'desktop' ? [768, 1024, 1280, 1440] : [360, 390];
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['dark', 'light']) {
      await page.getByRole('button', { name: `Switch to ${theme} mode`, exact: true }).click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const geometry = await page.locator('.guide-map').evaluate((map) => {
        const cards = [...map.querySelectorAll('.guide-state')].map((card) =>
          card.getBoundingClientRect(),
        );
        return [...map.querySelectorAll('.guide-transition > span')].map((span) => {
          const element = span as HTMLElement,
            box = element.getBoundingClientRect();
          const range = document.createRange();
          range.selectNodeContents(element);
          const text = range.getBoundingClientRect();
          return {
            label: element.textContent,
            overlapsCard: cards.some(
              (card) =>
                Math.min(box.right, card.right) - Math.max(box.left, card.left) > 1 &&
                Math.min(box.bottom, card.bottom) - Math.max(box.top, card.top) > 1,
            ),
            clipped:
              element.scrollWidth > element.clientWidth + 1 ||
              text.left < box.left - 1 ||
              text.right > box.right + 1,
            outsideMap:
              box.left < map.getBoundingClientRect().left - 1 ||
              box.right > map.getBoundingClientRect().right + 1,
          };
        });
      });
      for (const label of geometry) {
        expect(label.overlapsCard, `${width}/${theme}: ${label.label} overlaps a state`).toBe(
          false,
        );
        expect(label.clipped, `${width}/${theme}: ${label.label} is clipped`).toBe(false);
        expect(label.outsideMap, `${width}/${theme}: ${label.label} exceeds map width`).toBe(false);
      }
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Learn about Cancelled', exact: true }).click();
  await expect(page.locator('.guide-explanation')).toContainText('cannot be reactivated');
  for (const theme of ['dark', 'light']) {
    await page.getByRole('button', { name: `Switch to ${theme} mode`, exact: true }).click();
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
    await page.screenshot({ path: info.outputPath(`guide-${theme}.png`), fullPage: true });
  }
  await page
    .getByText('Why can the same product appear in another return?', { exact: true })
    .click();
  await expect(page.locator('.guide-quantity-example')).toBeVisible();
  expect(writes).toEqual([]);
});

test('keeps the guide and selected profile when switching role or customer', async ({
  page,
  startDemo,
}) => {
  await startDemo();
  const initialCustomer = new URL(page.url()).pathname.split('/')[2];
  await page.getByRole('link', { name: 'Administrator', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Return requests', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'How returns work', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/demo/guide\\?view=admin&customer=${initialCustomer}$`));
  const guideLink = page.getByRole('link', { name: 'How returns work', exact: true });
  await expect(guideLink).toHaveAttribute('aria-current', 'page');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('link', { name: 'Demo settings', exact: true })).not.toHaveClass(
    /active/,
  );
  await page.getByRole('link', { name: 'Customer', exact: true }).click();
  await expect(page).toHaveURL(
    new RegExp(`/demo/guide\\?view=customer&customer=${initialCustomer}$`),
  );
  await page.getByRole('button', { name: 'Select customer' }).click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Select customer' })).toContainText('Jordan Lee');
  const nextCustomer = new URL(page.url()).searchParams.get('customer');
  expect(nextCustomer).not.toBe(initialCustomer);
  expect(new URL(page.url()).pathname).toBe('/demo/guide');
  await page.getByRole('link', { name: 'Administrator', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/demo/guide\\?view=admin&customer=${nextCustomer}$`));
  await page.getByRole('link', { name: 'Demo settings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Demo settings', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Demo settings', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(guideLink).not.toHaveClass(/active/);
  await page.getByRole('link', { name: 'How returns work', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'The complete picture' })).toBeVisible();
});
