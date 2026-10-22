import { test, expect } from './fixtures';

test('serves branded SVG and multi-size ICO icons consistently on landing and nested routes', async ({
  page,
  context,
  startDemo,
}) => {
  await page.goto('/');
  const links = await page.locator('link[rel="icon"]').evaluateAll((nodes) =>
    nodes.map((node) => ({
      href: (node as HTMLLinkElement).href,
      type: (node as HTMLLinkElement).type,
    })),
  );
  expect(links.length).toBe(2);
  expect(new Set(links.map((link) => link.href)).size).toBe(2);
  for (const icon of links) {
    const response = await context.request.get(icon.href);
    expect(response.status()).toBe(200);
    if (icon.type === 'image/svg+xml') {
      expect(response.headers()['content-type']).toContain('image/svg+xml');
      expect(await response.text()).toContain('viewBox="0 0 32 32"');
    } else {
      expect(response.headers()['content-type']).toMatch(/image\/(?:x-icon|vnd\.microsoft\.icon)/);
      const body = await response.body();
      expect(body.readUInt16LE(2)).toBe(1);
      expect(body.readUInt16LE(4)).toBe(3);
      expect([0, 1, 2].map((index) => body.readUInt8(6 + index * 16))).toEqual([16, 32, 48]);
    }
  }
  await startDemo();
  const nested = await page
    .locator('link[rel="icon"]')
    .evaluateAll((nodes) => nodes.map((node) => (node as HTMLLinkElement).href));
  expect(nested.sort()).toEqual(links.map((link) => link.href).sort());
  await page.getByRole('link', { name: 'Administrator', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Return requests', exact: true })).toBeVisible();
  expect(
    await page
      .locator('link[rel="icon"]')
      .evaluateAll((nodes) => nodes.map((node) => (node as HTMLLinkElement).href).sort()),
  ).toEqual(nested.sort());
});
