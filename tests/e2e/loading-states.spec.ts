import { test, expect } from './fixtures';

test('uses section-shaped initial skeletons and retains real orders during refresh', async ({
  page,
  context,
  startDemo,
}, info) => {
  await startDemo();
  const customerId = new URL(page.url()).pathname.split('/')[2];
  const orders = (await (await context.request.get(`/api/customers/${customerId}/orders`)).json())
    .data.items;
  const returns = (await (await context.request.get(`/api/customers/${customerId}/returns`)).json())
    .data.items;
  const orderId = orders.find(
    (o: { eligibility: { eligible: boolean } }) => o.eligibility.eligible,
  ).id;
  const cases = [
    {
      url: `/customer/${customerId}/orders`,
      api: `/api/customers/${customerId}/orders`,
      variant: 'orders',
      label: 'Loading orders',
    },
    {
      url: '/admin/returns',
      api: '/api/admin/returns',
      variant: 'admin',
      label: 'Loading return requests',
    },
    {
      url: `/customer/${customerId}/returns`,
      api: `/api/customers/${customerId}/returns`,
      variant: 'returns',
      label: 'Loading your returns',
    },
    {
      url: `/customer/${customerId}/returns/${returns[0].id}`,
      api: `/api/customers/${customerId}/returns/${returns[0].id}`,
      variant: 'return-detail',
      label: 'Loading return details',
    },
    {
      url: `/customer/${customerId}/orders/${orderId}/return`,
      api: `/api/customers/${customerId}/orders/${orderId}`,
      variant: 'return-form',
      label: 'Loading return products',
    },
    {
      url: '/admin/policy',
      api: '/api/admin/policy',
      variant: 'policy',
      label: 'Loading return policy',
    },
    {
      url: `/demo/reset?view=admin&customer=${customerId}`,
      api: '/api/demo',
      variant: 'settings',
      label: 'Loading demo settings',
    },
  ];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const c of cases) {
    await page.evaluate(
      (dark) => localStorage.setItem('orm-theme', dark ? 'dark' : 'light'),
      ['admin', 'return-form', 'settings'].includes(c.variant),
    );
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const match = (url: URL) => url.pathname === c.api;
    await page.route(match, async (route) => {
      await gate;
      await route.continue();
    });
    try {
      await page.goto(c.url);
      const loading = page.getByRole('status', { name: c.label, exact: true });
      await expect(loading).toBeVisible();
      await expect(loading).toHaveAttribute('aria-busy', 'true');
      expect(
        await loading
          .locator('.skeleton-block')
          .first()
          .evaluate((el) => getComputedStyle(el).animationName),
      ).toBe('none');
      if (c.variant === 'return-form')
        await page.screenshot({
          path: info.outputPath('return-form-loading-dark.png'),
          fullPage: true,
        });
      expect(await loading.locator('button,a,input,textarea,select').count()).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const initial = await loading.boundingBox();
      if (c.variant === 'orders') {
        const top = await loading.locator('.master-detail').boundingBox();
        await page.screenshot({ path: info.outputPath('orders-loading.png'), fullPage: true });
        release();
        await expect(loading).toHaveCount(0);
        const real = await page.locator('.master-detail').boundingBox();
        expect(Math.abs(real!.y - top!.y)).toBeLessThan(12);
      } else {
        release();
        await expect(loading).toHaveCount(0);
      }
      const content = await page.locator('#main').boundingBox();
      expect(Math.abs(initial!.x - content!.x)).toBeLessThanOrEqual(40);
    } finally {
      release();
      await page.unroute(match);
    }
  }
  await page.goto(`/customer/${customerId}/orders`);
  await expect(page.getByRole('heading', { name: 'Your orders', exact: true })).toBeVisible();
  let release!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  const match = (url: URL) => url.pathname === `/api/customers/${customerId}/orders`;
  await page.route(match, async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.getByRole('button', { name: 'Refresh' }).click();
    await expect(page.getByRole('heading', { name: 'Order ORM-1045', exact: true })).toBeVisible();
    await expect(page.locator('.section-skeleton')).toHaveCount(0);
    release();
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeEnabled();
  } finally {
    release();
    await page.unroute(match);
  }
});

test('distinguishes unselected hover from the selected customer in both themes', async ({
  page,
  startDemo,
}) => {
  await startDemo();
  for (const dark of [false, true]) {
    if (dark) await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await page.getByRole('button', { name: 'Select customer' }).click();
    const selected = page.locator('[role="option"][aria-selected="true"]');
    const other = page.locator('[role="option"][aria-selected="false"]');
    const selectedColor = await selected.evaluate((el) => getComputedStyle(el).backgroundColor);
    const selectedText = await selected.evaluate((el) => getComputedStyle(el).color);
    await other.hover();
    await other.evaluate((el) =>
      Promise.all(el.getAnimations().map((a) => a.finished.catch(() => {}))),
    );
    await expect
      .poll(() => other.evaluate((el) => getComputedStyle(el).backgroundColor))
      .not.toBe(selectedColor);
    expect(await other.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
    expect(await other.evaluate((el) => getComputedStyle(el).color)).toBe(selectedText);
    expect(await selected.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(
      selectedColor,
    );
    await page.keyboard.press('Escape');
  }
});

test('keeps the loaded admin queue when a separately fetched request detail is pending', async ({
  page,
  context,
  startDemo,
}) => {
  await startDemo();
  const data = await (await context.request.get('/api/admin/returns')).json();
  const selected = data.data.items[0];
  const listMatch = (url: URL) => url.pathname === '/api/admin/returns';
  await page.route(listMatch, (route) =>
    route.fulfill({
      json: {
        ...data,
        data: {
          ...data.data,
          items: data.data.items.filter((r: { id: string }) => r.id !== selected.id),
        },
      },
    }),
  );
  let release!: () => void;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  const detailMatch = (url: URL) => url.pathname === `/api/admin/returns/${selected.id}`;
  await page.route(detailMatch, async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.goto(`/admin/returns/${selected.id}`);
    await expect(
      page.getByRole('status', { name: 'Loading request details', exact: true }),
    ).toBeVisible();
    await expect(page.locator('.request-queue .queue-item')).toHaveCount(5);
    await expect(page.getByText('No requests in this view', { exact: true })).toHaveCount(0);
    release();
    await expect(
      page.getByRole('status', { name: 'Loading request details', exact: true }),
    ).toHaveCount(0);
    await expect(page.locator('.request-detail .detail-title h2')).toHaveText(
      selected.displayNumber,
    );
  } finally {
    release();
    await page.unroute(detailMatch);
    await page.unroute(listMatch);
  }
});
