import { test, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const BASE = '/xArtists'
mkdirSync('artifacts/ux-mobile', { recursive: true })

async function visit(page: import('@playwright/test').Page, path: string) {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
  await expect(page.locator('#root')).toBeVisible()
}

test.describe('xArtists public accessibility, local built frontend only', () => {
  for (const width of [360, 390, 430]) {
    test(`mobile ${width}px: no auto-WebGL and direct museum/market/auction/studio dock`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await visit(page, '/')
      await expect(page.locator('.xa-mobile-dock')).toBeVisible()
      await expect(page.locator('.xa-mobile-dock a')).toHaveCount(5)
      await expect(page.locator('.xa-hero-2d-button')).toBeVisible()
      await expect(page.locator('.xa-hero-visual canvas')).toHaveCount(0)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
      expect(overflow, `Home horizontal overflow at ${width}px: ${overflow}px`).toBeLessThanOrEqual(12)
      await page.screenshot({ path: `artifacts/ux-mobile/home-${width}.png` })
    })
  }

  test('desktop 1440px Home remains navigable, without wallet', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await visit(page, '/')
    await expect(page.locator('.xa-desktop-nav')).toBeVisible()
    await expect(page.locator('a[href*="marketplace"], a[href*="/explore/market"]').first()).toBeVisible()
    await page.screenshot({ path: 'artifacts/ux-mobile/home-desktop-1440.png' })
  })

  test('reduced motion requests a lightweight static Home, even on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await visit(page, '/')
    await expect(page.locator('.xa-hero-2d-button')).toBeVisible()
    await expect(page.locator('.xa-hero-visual canvas')).toHaveCount(0)
  })

  test('visitor guide at 390px never links to retired Slot, and offers legal access', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await visit(page, '/guide/')
    await expect(page.getByRole('heading', { name: /huit étapes|eight steps/i })).toBeVisible()
    await expect(page.locator('a[href*="/slot"]')).toHaveCount(0)
    for (const path of ['/museum', '/marketplace', '/auction', '/studio', '/lia', '/offres', '/legal']) {
      await expect(page.locator(`a[href*="${path}"]`).first()).toBeVisible()
    }
    await page.screenshot({ path: 'artifacts/ux-mobile/guide-390.png' })
  })

  test('previous crashing Hatom and Support route render headings without provider error', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    for (const [path, label] of [
      ['/finance/hatom/', /Hatom Protocol/i],
      ['/finance/support/', /Soutenir LIA|Support LIA|Tips & services/i],
    ] as const) {
      await visit(page, path)
      await expect(page.getByRole('heading', { name: label }).last()).toBeVisible()
      await expect(page.getByText('Page unavailable')).toHaveCount(0)
      await expect(page.getByText(/must be used inside MultiversXProvider/)).toHaveCount(0)
    }
  })

  test('TRO/Solana informational portal loads directly and never exposes a deposit', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await visit(page, '/finance/tro/sale/')
    await expect(page.locator('.tro-portal__hero')).toBeVisible()
    await expect(page.getByText(/Bridge Solana : désactivé/)).toBeVisible()
    await expect(page.getByText('Page unavailable')).toHaveCount(0)
    await page.screenshot({ path: 'artifacts/ux-mobile/tro-sale-390.png' })
  })

  test('advertising mock never instructs EGLD transfer and RWA says values are paper', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await visit(page, '/create/visibility/')
    await expect(page.getByText(/Présentation uniquement/)).toBeVisible()
    await expect(page.getByText(/Ne transférez pas d’EGLD/)).toBeVisible()
    await expect(page.getByText(/Paiement V1/)).toHaveCount(0)
    await page.screenshot({ path: 'artifacts/ux-mobile/visibility-390.png' })

    await visit(page, '/explore/rwa/')
    await expect(page.getByText(/Catalogue de démonstration/)).toBeVisible()
    await expect(page.getByText(/Garde physique : non vérifiée/).first()).toBeVisible()
    await page.screenshot({ path: 'artifacts/ux-mobile/rwa-390.png' })
  })

  test('status is visitor-first; legal tabs have distinct accessible labels', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await visit(page, '/workspace/status/')
    await expect(page.getByText(/Disponibilité des services/)).toBeVisible()
    await expect(page.getByRole('button', { name: /diagnostics techniques/ })).toHaveAttribute('aria-expanded', 'false')
    await expect(page.locator('#xa-operator-diagnostics')).toHaveCount(0)

    await visit(page, '/legal/')
    const tabs = page.locator('button[aria-controls="xa-legal-content"]')
    await expect(tabs).toHaveCount(6)
    await expect(page.getByRole('button', { name: /Product terms|Conditions produits/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Terms of use|Conditions d’utilisation/ })).toBeVisible()
    await page.screenshot({ path: 'artifacts/ux-mobile/legal-390.png' })
  })
})
