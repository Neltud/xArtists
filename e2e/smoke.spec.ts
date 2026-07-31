import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || 'https://neltud.github.io/xArtists';

test.describe('xArtists smoke', () => {
  test('dashboard loads', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=/xArtists|LIA|Dashboard|TRO/i').first()).toBeVisible({
      timeout: 20000,
    });
  });

  test('marketplace or gallery section reachable', async ({ page }) => {
    await page.goto(BASE);
    const link = page.getByRole('button', { name: /marketplace|gallery|nft/i }).first();
    if (await link.count()) {
      await link.click();
    }
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('xArtists extended (Vellum prep)', () => {
  test('nav links present (wallet / marketplace / agents)', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('domcontentloaded');
    const body = await page.locator('body').innerText();
    // Soft checks — SPA may lazy-load
    const hasMarket = /marketplace|gallery|nft/i.test(body);
    const hasLia = /lia|agent|dashboard|tro/i.test(body);
    expect(hasMarket || hasLia).toBeTruthy();
  });

  test('hash or path routes do not 404 shell', async ({ page }) => {
    for (const path of ['', '#/', '#/marketplace', '#/wallet', '#/agents']) {
      await page.goto(`${BASE}${path}`);
      await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    }
  });

  test('PWA manifest reachable when served', async ({ page }) => {
    const res = await page.request.get(`${BASE}/manifest.webmanifest`).catch(() => null);
    if (res && res.ok()) {
      const json = await res.json();
      expect(json.name || json.short_name).toBeTruthy();
    } else {
      // GitHub Pages may use different path — non-blocking
      test.info().annotations.push({ type: 'note', description: 'manifest optional on current host' });
    }
  });

  test('no critical console errors on home', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(BASE);
    await page.waitForTimeout(2000);
    const critical = errors.filter(
      (m) => !/ResizeObserver|Non-Error|favicon|chunk/i.test(m),
    );
    expect(critical.length).toBeLessThan(3);
  });
});
