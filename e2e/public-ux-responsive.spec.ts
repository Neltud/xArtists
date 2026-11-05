import { test, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const BASE = '/xArtists'
function contrastRatio(foreground: string, background: string): number {
  const luminance = (color: string) => {
    const rgb = (color.match(/\\d+(?:\\.\\d+)?/g) || []).slice(0, 3).map(Number)
    const linear = rgb.map(n => {
      const channel = n / 255
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    })
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722
  }
  const a = luminance(foreground), b = luminance(background)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}
mkdirSync('artifacts/ux-mobile', { recursive: true })

async function visit(page: import('@playwright/test').Page, path: string) {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' })
  await expect(page.locator('#root')).toBeVisible()
}

test.describe('xArtists public accessibility, local built frontend only', () => {
  for (const width of [390, 1440]) {
    test(`optional TRO and RWA detail opens by keyboard at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await visit(page, '/finance/tro/sale/')
      const roadmap = page.locator('#tro-roadmap-details-trigger')
      await expect(roadmap).toHaveAttribute('aria-expanded', 'false')
      await expect(page.getByText(/Bridge Solana : désactivé/)).toBeVisible()
      await expect(page.getByRole('button', { name: 'Bridge non disponible', exact: true })).toBeDisabled()
      await roadmap.press('Enter')
      await expect(roadmap).toHaveAttribute('aria-expanded', 'true')
      await expect(page.locator('#tro-roadmap-details')).toBeVisible()
      await roadmap.press('Space')
      await expect(page.locator('#tro-roadmap-details')).toBeHidden()

      await visit(page, '/explore/rwa/')
      await expect(page.locator('.rwa-public__card')).toHaveCount(3)
      await expect(page.locator('#rwa-study-0')).toBeHidden()
      await expect(page.getByText(/Garde physique : non vérifiée/).first()).toBeVisible()
      await page.locator('#rwa-study-0-trigger').click()
      await expect(page.getByText(/Valeur fictive indicative/).first()).toBeVisible()
      const preparation = page.locator('#rwa-preparation-trigger')
      await preparation.click()
      const title = page.locator('#rwa-preparation input:not([type="file"])').first()
      await title.fill('Étude locale de vérification')
      await preparation.click()
      await preparation.click()
      await expect(title).toHaveValue('Étude locale de vérification')
      await page.screenshot({ animations: 'disabled', fullPage: true, path: `artifacts/ux-mobile/rwa-details-${width}.png` })
    })
  }
  for (const width of [360, 390, 430]) {
    test(`mobile ${width}px: no auto-WebGL and direct market/auction/studio/DAO dock`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await visit(page, '/')
      await expect(page.locator('.xa-mobile-dock')).toBeVisible()
      await expect(page.locator('.xa-mobile-dock a')).toHaveCount(5)
      await expect(page.locator('.xa-first-hero')).toBeVisible()
      await expect(page.locator('.xa-first-tile')).toHaveCount(4)
      await expect(page.locator('.xa-first-hero canvas')).toHaveCount(0)
      for (const path of ['/marketplace', '/auction', '/studio', '/finance/governance']) {
        await expect(page.locator(`.xa-mobile-dock a[href*="${path}"]`)).toHaveCount(1)
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
      expect(overflow, `Home horizontal overflow at ${width}px: ${overflow}px`).toBeLessThanOrEqual(12)
      await page.screenshot({ animations: 'disabled', path: `artifacts/ux-mobile/home-${width}.png` })
    })
  }

  test('desktop 1440px Home remains navigable, without wallet', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await visit(page, '/')
    await expect(page.locator('.xa-desktop-nav')).toBeVisible()
    await expect(page.locator('.xa-first-hero')).toBeVisible()
    await expect(page.locator('.xa-first-tile')).toHaveCount(4)
    await expect(page.locator('a[href*="marketplace"], a[href*="/explore/market"]').first()).toBeVisible()
    await page.screenshot({ animations: 'disabled', path: 'artifacts/ux-mobile/home-desktop-1440.png' })
  })

  test('light-first theme toggle is visible and dark preference survives reload', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await visit(page, '/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    const toggle = page.locator('.xa-theme-toggle')
    await expect(toggle).toBeVisible()
    await toggle.click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('reduced motion requests a lightweight static Home, even on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await visit(page, '/')
    await expect(page.locator('.xa-first-hero')).toBeVisible()
    await expect(page.locator('.xa-first-hero canvas')).toHaveCount(0)
    await expect(page.locator('.xa-first-journeys')).toBeVisible()
  })

  test('editorial roadmap is readable on mobile and desktop without wallet or fake checkout', async ({ page }) => {
    for(const width of [390, 1440]){
      await page.setViewportSize({width,height:900})
      await visit(page, '/roadmap/')
      await expect(page.locator('.xa-roadmap-page h1')).toBeVisible()
      await expect(page.locator('.xa-roadmap-milestone')).toHaveCount(6)
      await expect(page.locator('.xa-roadmap-milestone a[href*="/issues/"]')).toHaveCount(6)
      await expect(page.locator('.xa-roadmap-note')).toBeVisible()
      await expect(page.locator('.xa-mobile-dock')).toHaveCount(1)
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)
      expect(overflow, `roadmap horizontal overflow at ${width}px`).toBeLessThanOrEqual(12)
      await page.screenshot({animations:'disabled',path:`artifacts/ux-mobile/roadmap-${width}.png`})
    }
  })

  test('CSS orbital art stays optional, stops for reduced motion and does not obstruct mobile', async ({ page }) => {
    await page.setViewportSize({width:1440,height:900})
    await visit(page,'/')
    await expect(page.locator('.xa-orbital-stage')).toBeVisible()
    await expect(page.locator('.xa-orbital-panel')).toHaveCount(3)
    await expect(page.locator('.xa-orbital-stage canvas')).toHaveCount(0)
    await page.emulateMedia({reducedMotion:'reduce'})
    const animation=await page.locator('.xa-orbital-axis').evaluate(node=>getComputedStyle(node).animationName)
    expect(animation).toBe('none')
    await page.setViewportSize({width:390,height:844})
    await expect(page.locator('.xa-orbital-stage')).toBeHidden()
    await expect(page.locator('.xa-mobile-dock')).toBeVisible()
  })

  test('phone screenshots: compact connected-wallet header always exposes menu and music via dialog', async ({ page }) => {
    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 })
      await visit(page, '/auction/')
      const header = page.locator('.xa-header-inner')
      await expect(header).toBeVisible()
      const menu = page.locator('.xa-mobile-trigger')
      await expect(menu).toBeVisible()
      await expect(page.locator('.xa-connect svg')).toBeVisible()
      await expect(page.locator('.xa-connect span')).toBeHidden()
      await expect(page.locator('.music-player-toggle')).toBeHidden()
      const box = await menu.boundingBox()
      expect(box, 'menu has measurable hit target').toBeTruthy()
      expect(box!.width).toBeGreaterThanOrEqual(35)
      expect(box!.x + box!.width).toBeLessThanOrEqual(width)
      await menu.click()
      await expect(page.locator('.xa-mobile-lang select')).toBeVisible()
      await expect(page.locator('.xa-mobile-music')).toBeVisible()
      await page.keyboard.press('Escape')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
      expect(overflow, `header overflow at ${width}px`).toBeLessThanOrEqual(12)
      await page.screenshot({ animations: 'disabled', path: `artifacts/ux-mobile/header-readability-${width}.png` })
    }
  })

  test('phone screenshots: auction and guide disclaimers remain readable in light theme', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await visit(page, '/auction/')
    await expect(page.locator('.xa-auction-preview')).toBeVisible()
    const preview = await page.locator('.xa-auction-preview').evaluate(el => ({
      background: getComputedStyle(el).backgroundColor,
      text: getComputedStyle(el.querySelector('h2')!).color,
    }))
    expect(preview.background).toBe('rgb(32, 37, 30)')
    expect(contrastRatio(preview.text, preview.background)).toBeGreaterThanOrEqual(7)
    const warning = await page.locator('.xa-auction-public-notice').evaluate(el => getComputedStyle(el).color)
    expect(warning).not.toBe('rgb(255, 237, 213)')
    await page.screenshot({ animations: 'disabled', path: 'artifacts/ux-mobile/auction-contrast-390.png' })
    await visit(page, '/guide/')
    const guideNotice = page.locator('header [role="status"]')
    await expect(guideNotice).toBeVisible()
    expect(await guideNotice.evaluate(el => getComputedStyle(el).color)).toBe('rgb(107, 74, 19)')
  })

  test('phone screenshots: NFT factory layers and inputs do not escape viewport', async ({ page }) => {
    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 844 })
      await visit(page, '/nft-factory/')
      await expect(page.locator('.xa-nft-factory')).toBeVisible()
      await page.getByLabel('Mode de design').selectOption('layers')
      const rights = page.locator('.xa-nft-factory input[type="checkbox"]').first()
      await expect(rights).toBeVisible()
      expect(await rights.evaluate(el => el.getBoundingClientRect().width)).toBeLessThan(32)
      await expect(page.locator('.xa-nft-variant-row').first()).toBeVisible()
      const offscreen = await page.locator('.xa-nft-factory').evaluate(el =>
        [...el.querySelectorAll('input, textarea, select, button, .card, .xa-nft-layer-row, .xa-nft-variant-row')]
          .filter(node => {
            const rect = node.getBoundingClientRect()
            return rect.width > 0 && (rect.right > window.innerWidth + 2 || rect.left < -2)
          })
          .map(node => ({ tag: node.tagName, className: node.className, right: Math.round(node.getBoundingClientRect().right) }))
      )
      expect(offscreen, `NFT Factory clipped controls at ${width}px`).toEqual([])
      await page.screenshot({ animations: 'disabled', path: `artifacts/ux-mobile/nft-layers-fit-${width}.png` })
    }
  })

  test('phone screenshot: staking pool cards use readable light surfaces', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await visit(page, '/staking/')
    const card = page.locator('.xa-staking-pool-card').first()
    await expect(card).toBeVisible()
    expect(await card.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(245, 247, 243)')
    await page.screenshot({ animations: 'disabled', path: 'artifacts/ux-mobile/staking-pool-contrast-390.png' })
  })

  test('visitor guide at 390px never links to retired Slot, and offers legal access', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await visit(page, '/guide/')
    await expect(page.getByRole('heading', { name: /huit étapes|eight steps/i })).toBeVisible()
    await expect(page.locator('a[href*="/slot"]')).toHaveCount(0)
    for (const path of ['/museum', '/marketplace', '/auction', '/studio', '/lia', '/offres', '/legal']) {
      await expect(page.locator(`ol a[href*="${path}"]`).first()).toBeVisible()
    }
    await page.screenshot({ animations: 'disabled', fullPage: true, path: 'artifacts/ux-mobile/guide-390.png' })
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
    await page.screenshot({ animations: 'disabled', fullPage: true, path: 'artifacts/ux-mobile/tro-sale-390.png' })
  })

  test('advertising mock never instructs EGLD transfer and RWA says values are paper', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await visit(page, '/create/visibility/')
    await expect(page.getByText(/Présentation uniquement/)).toBeVisible()
    await expect(page.getByText(/Ne transférez pas d’EGLD/)).toBeVisible()
    await expect(page.getByText(/Paiement V1/)).toHaveCount(0)
    await page.screenshot({ animations: 'disabled', fullPage: true, path: 'artifacts/ux-mobile/visibility-390.png' })

    await visit(page, '/explore/rwa/')
    await expect(page.getByText(/Catalogue de démonstration/)).toBeVisible()
    await expect(page.getByText(/Garde physique : non vérifiée/).first()).toBeVisible()
    await page.screenshot({ animations: 'disabled', fullPage: true, path: 'artifacts/ux-mobile/rwa-390.png' })
  })

  test('mobile 390px: public journey scrolls without sideways overflow or wallet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    for (const path of ['/guide/', '/marketplace/', '/auction/', '/explore/rwa/', '/finance/tro/sale/', '/legal/']) {
      await visit(page, path)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow, `${path} horizontal overflow at 390px: ${overflow}px`).toBeLessThanOrEqual(12)
      await expect(page.locator('.xa-mobile-dock')).toBeVisible()
    }
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
    await page.screenshot({ animations: 'disabled', fullPage: true, path: 'artifacts/ux-mobile/legal-390.png' })
  })
})
