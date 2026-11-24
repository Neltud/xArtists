import { test, expect, type Page } from '@playwright/test';

const BASE = (process.env.E2E_BASE_URL || 'https://xartists.art').replace(/\/+$/, '');

// Read-only checks of the deployed host, separate from the PR-local UX suite.
async function visitPublished(page: Page, path: string) {
  const response = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  expect(response, `No HTTP response for ${path}`).not.toBeNull();
  expect(response!.status(), `Direct published route ${path} must return HTTP 200`).toBe(200);
  await expect(page.locator('#root')).toBeVisible();
  await expect(page.getByText('Page unavailable', { exact: true })).toHaveCount(0);
}

test.describe('xArtists published Pages — no wallet or transactions', () => {
  test.use({ reducedMotion: 'reduce' });

  test('home renders the application', async ({ page }) => {
    await visitPublished(page, '/');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  });

  for (const route of [
    { path: '/marketplace/?lang=fr', heading: /^(Découvrir|Discover)$/i },
    { path: '/auction/', heading: /Salle des enchères|Auction room/i },
    { path: '/finance/tro/sale/', heading: null },
  ]) {
    test(`direct ${route.path} returns 200 and renders its page`, async ({ page }) => {
      await visitPublished(page, route.path);
      if (route.heading) {
        await expect(page.getByRole('heading', { name: route.heading })).toBeVisible();
      } else {
        // Verify the deployed token route during either side of the workspace rollout.
        await expect(page.locator('#tro-hero-title')).toBeVisible();
        await expect(page.getByText(/Bridge Solana : désactivé|Bridge et vente directe fermés|Bridge and direct sale closed/i).first()).toBeVisible();
      }
    });
  }

  test('published marketplace loads without presuming any static Drive media is an NFT', async ({ page }) => {
    await visitPublished(page, '/marketplace/?lang=fr');
    await expect(page.locator('#xa-featured-title')).toBeVisible();
    await expect(page.locator('main h1')).toHaveCount(1);
    const catalogue = page.locator('.xa-market-depth');
    await expect(catalogue).not.toHaveAttribute('open', '');
    await expect(page.locator('.xa-market-grid')).toBeHidden();
    await catalogue.locator(':scope > summary').click();
    await expect(catalogue).toHaveAttribute('open', '');
    await expect(page.locator('.xa-market-grid')).toBeVisible();
    await expect(page.locator('.xa-market-grid__heading h2')).toBeVisible();
    await expect(page.locator('.xa-market-grid__filters')).toBeVisible();
  });

  test('published build stamp is available (not a PR SHA assertion)', async ({ request }) => {
    const response = await request.get(`${BASE}/build-info.json`);
    expect(response.status()).toBe(200);
    const stamp = await response.json();
    expect(stamp.source_sha).toMatch(/^[a-f0-9]{40}$/);
    await test.info().attach('published-build-info', {
      body: JSON.stringify(stamp, null, 2), contentType: 'application/json',
    });
  });

  test('home has no unhandled application or chunk-loading errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await visitPublished(page, '/');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    // Keep listening briefly for deferred/lazy-module errors after rendering.
    await page.waitForTimeout(2000);
    expect(errors.filter(message => !/ResizeObserver loop/i.test(message))).toEqual([]);
  });
});
