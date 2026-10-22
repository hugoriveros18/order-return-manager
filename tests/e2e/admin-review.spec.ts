import { test, expect } from './fixtures';
test('provides a scoped review queue and distinct policy navigation', async ({
  page,
  startDemo,
}) => {
  await startDemo();
  await page.getByRole('link', { name: 'Administrator', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Return requests', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return policy', exact: true })).toBeVisible();
  await expect(page.locator('.request-queue .queue-item')).toHaveCount(6);
  await expect(page.getByLabel('2 pending requests')).toBeVisible();
});

test('uses the same reason and outcome semantics across all customer and administrator states', async ({
  page,
  context,
}, info) => {
  test.setTimeout(180000);
  const { fixture, requestFixture, removeFixture } = await import('../helpers/factories');
  const { cookieNames } = await import('@/features/demo/cookies');
  const { db } = await import('@/lib/prisma');
  for (const status of ['PENDING', 'APPROVED', 'REJECTED', 'RECEIVED', 'CANCELLED'] as const) {
    const f = await fixture();
    try {
      const request = await requestFixture(f, status);
      const reason = 'The mouse does not fit my workspace.\n' + 'LongReason'.repeat(24);
      const rejection = 'Not covered by this policy.\n' + 'Explanation'.repeat(24);
      await db().returnRequest.update({
        where: { id: request.id },
        data: { reason, ...(status === 'REJECTED' ? { rejectionReason: rejection } : {}) },
      });
      if (status === 'REJECTED') {
        await db().historyEvent.updateMany({
          where: { requestId: request.id, eventType: 'REJECTED' },
          data: { reason: rejection },
        });
      }
      await context.addCookies(
        [cookieNames.visitor, cookieNames.demo].map((name) => ({
          name,
          value: f.token,
          url: 'http://127.0.0.1:3100',
        })),
      );
      for (const theme of ['light', 'dark']) {
        await page.goto('/');
        await page.evaluate((value) => localStorage.setItem('orm-theme', value), theme);
        const styles: { background: string; border: string; color: string }[] = [];
        for (const view of ['admin', 'customer']) {
          await page.goto(
            view === 'admin'
              ? `/admin/returns/${request.id}`
              : `/customer/${f.order.customerId}/returns/${request.id}`,
          );
          const detail = page.locator(
            view === 'admin' ? '.request-detail' : '.customer-return-detail',
          );
          await expect(detail.locator('.reason-summary')).toHaveText(
            new RegExp(view === 'admin' ? 'Customer reason' : 'Your reason'),
          );
          await expect(detail.locator('.reason-summary p')).toHaveText(reason);
          let panel = detail.locator('.return-instructions');
          if (status === 'REJECTED') {
            panel = detail.locator('.alert.error');
            await expect(
              panel.getByRole('heading', { name: 'Rejection reason', exact: true }),
            ).toBeVisible();
            await expect(panel.locator('p')).toHaveText(rejection);
          } else if (status === 'PENDING' || status === 'CANCELLED') {
            await expect(panel).toHaveCount(0);
            await expect(detail.locator('.alert.error')).toHaveCount(0);
          }
          if (status === 'APPROVED' || status === 'RECEIVED' || status === 'REJECTED') {
            await expect(panel).toBeVisible();
            styles.push(
              await panel.evaluate((el) => {
                const s = getComputedStyle(el);
                return { background: s.backgroundColor, border: s.borderLeftColor, color: s.color };
              }),
            );
            if (status === 'RECEIVED') await expect(panel).toHaveClass(/received-instructions/);
            const box = await panel.boundingBox(),
              original = await detail.locator('.reason-summary').boundingBox();
            expect(Math.abs(box!.x - original!.x)).toBeLessThan(2);
            expect(Math.abs(box!.width - original!.width)).toBeLessThan(2);
          }
          expect(await detail.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          ).toBe(true);
          if (status === 'REJECTED')
            await page.screenshot({
              path: info.outputPath(`${view}-rejection-${theme}.png`),
              fullPage: true,
            });
        }
        if (styles.length) expect(styles[0]).toEqual(styles[1]);
      }
    } finally {
      await removeFixture(f);
    }
  }
});
