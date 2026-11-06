import { test, expect } from '@playwright/test'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const BASE = '/xArtists'
const dist = fileURLToPath(new URL('../apps/frontend/dist/', import.meta.url))
const release = JSON.parse(readFileSync(dist + 'dapp-release.json', 'utf8'))
const routes: string[] = release.routes
const known = new Set(routes.map(path => path.replace(/\/$/, '') || '/'))
const results: Record<string, unknown> = {}
mkdirSync('artifacts/ux-mobile/routes', { recursive: true })

test.describe('all built routes and visible actions — anonymous, no signing', () => {
  test.describe.configure({ retries: 0, timeout: 30_000 })
  test.use({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })

  for (const path of routes) {
    test(`built route ${path}`, async ({ page }) => {
      const errors: string[] = []
      const blockedNonGetRequests: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      // Browsing proof only. Never let the crawler submit a mutation or a signed transaction.
      await page.route('**/*', async route => {
        const request = route.request()
        if (['GET', 'HEAD', 'OPTIONS'].includes(request.method())) return route.continue()
        const url = new URL(request.url())
        blockedNonGetRequests.push(request.method() + ' ' + url.origin + url.pathname)
        return route.abort('blockedbyclient')
      })
      const row: Record<string, unknown> = { path, status: 'failed', blockedNonGetRequests }
      try {
        expect(existsSync(dist + (path === '/' ? 'index.html' : path.slice(1) + '/index.html')),
          'A direct entry must exist in this build').toBe(true)
        const response = await page.goto(BASE + (path === '/' ? '/' : path + '/'), { waitUntil: 'domcontentloaded' })
        expect(response?.status()).toBe(200)
        await expect(page.locator('#root')).toBeVisible()
        await expect(page.locator('.xa-module-body > .xa-loading')).toHaveCount(0, { timeout: 10_000 })
        await expect(page.locator('.xa-not-found')).toHaveCount(0)
        await expect(page.getByText('Page unavailable', { exact: true })).toHaveCount(0)
        await expect(page.locator('h1').first()).toBeVisible()
        const links = await page.locator('a[href]').evaluateAll(elements => elements.map(element => ({
          text: (element.textContent || element.getAttribute('aria-label') || '').trim(),
          href: element.getAttribute('href') || '',
        })))
        const unresolved: string[] = []
        for (const { href } of links) {
          expect(href).not.toMatch(/^javascript:/i)
          const target = new URL(href, page.url())
          if (target.origin !== new URL(page.url()).origin || !target.pathname.startsWith(BASE + '/')) continue
          const local = target.pathname.slice(BASE.length).replace(/\/$/, '') || '/'
          const dynamic = /^\/(?:packs|intelligence\/agents)\/(?:pulse|yield|sentinel)$/.test(local)
            || /^\/explore\/artwork\/[a-zA-Z0-9-]+$/.test(local)
          if (!known.has(local) && !dynamic && !existsSync(dist + local.slice(1))) unresolved.push(href)
        }
        row.links = links
        row.unresolvedLinks = [...new Set(unresolved)]
        row.buttons = await page.locator('button:visible').evaluateAll(elements => elements.map(element => ({
          label: element.getAttribute('aria-label') || element.textContent?.trim() || element.getAttribute('title') || '',
          disabled: (element as HTMLButtonElement).disabled,
          expanded: element.getAttribute('aria-expanded'),
          validation: 'inventory only; financial/signing actions not executed',
        })))
        row.finalUrl = new URL(page.url()).pathname
        row.horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
        row.errors = errors
        expect(unresolved, 'Internal links must resolve to a built or supported dynamic route').toEqual([])
        expect(errors.filter(message => !/ResizeObserver loop/i.test(message))).toEqual([])
        expect(row.horizontalOverflow).toBeLessThanOrEqual(12)
        await page.screenshot({ animations: 'disabled', path: 'artifacts/ux-mobile/routes/' + (path.replace(/[^a-z0-9_-]+/gi, '_') || 'home') + '.png' })
        row.status = 'rendered'
      } finally {
        row.errors = errors
        results[path] = row
        writeFileSync('artifacts/ux-mobile/route-action-matrix.json', JSON.stringify({
          scope: 'local built frontend, anonymous 390px; no wallet/signing/payment proof',
          totalBuiltRoutes: routes.length, routes: results,
        }, null, 2))
      }
    })
  }
})

test('mobile dock links navigate to the five public destinations', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(BASE + '/')
  const dock = page.locator('.xa-mobile-dock')
  await expect(dock).toBeVisible()
  const hrefs = await dock.locator('a').evaluateAll(elements => elements.map(a => a.getAttribute('href')!))
  expect(hrefs).toHaveLength(5)
  const canonical: Record<string, string> = {
    '/': '/', '/museum': '/explore/museum', '/marketplace': '/explore/market',
    '/auction': '/explore/auction', '/studio': '/create/studio',
    '/finance/governance': '/finance/governance',
  }
  for (const href of hrefs) {
    const path = new URL(href, page.url()).pathname.slice(BASE.length).replace(/\/$/, '') || '/'
    expect(Object.hasOwn(canonical, path), 'The dock must expose one of the five intended destinations').toBe(true)
    await page.locator('.xa-mobile-dock a[href="' + href + '"]').click()
    await expect.poll(() => new URL(page.url()).pathname.replace(/\/$/, '')).toBe((BASE + canonical[path]).replace(/\/$/, ''))
    await expect(page.locator('.xa-mobile-dock a[href="' + href + '"]')).toHaveAttribute('aria-current', 'page')
    await expect(page.locator('.xa-module-body > .xa-loading')).toHaveCount(0)
    await expect(page.getByText('Page unavailable', { exact: true })).toHaveCount(0)
  }
})

test('directory search narrows modules and recovers from an empty result', async ({ page }) => {
  await page.goto(BASE + '/directory/?lang=fr')
  const input = page.locator('.xa-directory-page .xa-filter-search input')
  await input.fill('/legal')
  await expect(page.locator('.xa-directory-page .xa-module-card')).toHaveCount(1)
  await input.fill('no-such-module-2941')
  await expect(page.locator('.xa-directory-page .xa-module-card')).toHaveCount(0)
  await expect(page.locator('.xa-directory-page .xa-empty')).toBeVisible()
  await input.fill('')
  await expect(page.locator('.xa-directory-page .xa-module-card').first()).toBeVisible()
  await input.fill('musee')
  await expect(page.locator('.xa-directory-page .xa-module-card')).toHaveCount(1)
  await expect(page.locator('.xa-directory-page .xa-module-card').first()).toContainText('Musée immersif')
  await page.getByRole('button', { name: 'En préparation', exact: true }).click()
  await expect(page.locator('.xa-directory-page .xa-module-card')).toHaveCount(0)
  await expect(page.locator('.xa-directory-reset')).toBeVisible()
  await page.locator('.xa-directory-reset').click()
  await expect(page).toHaveURL(/lang=fr/)
  await expect(input).toHaveValue('')
  await expect(page.locator('.xa-directory-page .xa-module-card').first()).toBeVisible()
  await page.goto(BASE + '/directory/?lang=es')
  await input.fill('catalogo')
  await expect(page.locator('.xa-directory-page .xa-module-card')).toHaveCount(1)
  await expect(page.locator('.xa-directory-page .xa-module-card').first()).toContainText('Catálogo RWA')
})
