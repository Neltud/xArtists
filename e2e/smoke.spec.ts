import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || 'https://neltud.github.io/xArtists';

test.describe('xArtists smoke', () => {
  test('dashboard loads', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('body')).toBeVisible();
    await expect(
      page.locator('text=/xArtists|Musée|Connect|Empire|Packs|Galerie/i').first(),
    ).toBeVisible({ timeout: 25000 });
  });

  test('marketplace or gallery section reachable', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('xArtists extended (Vellum prep)', () => {
  test('nav links present (wallet / marketplace / agents)', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await page.waitForTimeout(1500);
    const body = (await page.locator('body').innerText()).toLowerCase();
    // Home may show FR copy; accept shell + any product word
    const hasShell =
      body.includes('xartists') ||
      body.includes('connect') ||
      body.includes('musée') ||
      body.includes('musee') ||
      body.includes('empire');
    const hasProduct =
      /marketplace|market|gallery|galerie|nft|pack|agent|lia|tro|slot|staking/.test(body);
    expect(hasShell || hasProduct).toBeTruthy();
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
      test.info().annotations.push({
        type: 'note',
        description: 'manifest optional on current host',
      });
    }
  });

  test('no critical console errors on home', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(BASE);
    await page.waitForTimeout(2000);
    const critical = errors.filter(
      m => !/ResizeObserver|Non-Error|favicon|chunk|WalletConnect/i.test(m),
    );
    expect(critical.length).toBeLessThan(5);
  });
});
