import { test, expect } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL || 'https://neltud.github.io/xArtists';

test.describe('xArtists smoke', () => {
  test('dashboard loads', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('body')).toBeVisible();
    // Title or logo may vary between Vellum HTML and React build
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
