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
    { path: '/marketplace/', heading: /L’art physique rencontre le Web3|Découvrez l’art.*Explorez ses univers|Physical art meets Web3|Discover art.*Explore its worlds|Œuvres à découvrir|Explore artworks/i },
    { path: '/auction/', heading: /Salle des enchères|Auction room/i },
    { path: '/finance/tro/sale/', heading: null },
  ]) {
    test(`direct ${route.path} returns 200 and renders its page`, async ({ page }) => {
      await visitPublished(page, route.path);
      if (route.heading) {
        await expect(page.getByRole('heading', { name: route.heading })).toBeVisible();
      } else {
        // The hero requires the TRO lazy module and its stylesheet to load.
        await expect(page.locator('.tro-portal__hero')).toBeVisible();
        await expect(page.getByText(/Bridge Solana : désactivé/)).toBeVisible();
      }
    });
  }

  test('public marketplace ships real studio PNG images and paints their thumbnails', async ({ page, request }) => {
    const artworks = ['xArtists0279.png','xArtists0269.png','xArtists0291.png','xArtists0286.png'] as const;
    // Catch both a Pages deployment which omits static art assets and a
    // runtime/CSP/onError failure which silently replaces a real image with xA.
    for (const filename of artworks) {
      const asset = await request.get(`${BASE}/art/drive/${filename}`);
      expect(asset.status(), filename + ' must be present at the public origin').toBe(200);
      expect(asset.headers()['content-type'], filename + ' must be served as PNG').toMatch(/^image\/png/i);
      const bytes = await asset.body();
      expect([...bytes.subarray(0, 8)]).toEqual([137,80,78,71,13,10,26,10]);
    }
    await visitPublished(page, '/marketplace/?lang=fr');
    const grid = page.locator('.xa-market-grid__cards');
    await expect(grid).toBeVisible();
    const cards = grid.locator('.xa-market-grid__card');
    expect(await cards.count()).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < artworks.length; i++) {
      const image = cards.nth(i).locator('img');
      await expect(image).toHaveAttribute('src', new RegExp(artworks[i].replace('.', '\\.') + '
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
));
      await expect(image).toBeVisible();
      await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth),
        { timeout: 12_000, message: artworks[i] + ' must decode and display, not just exist in markup' }).toBeGreaterThan(0);
    }
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
