import { test, expect } from '@playwright/test'
import { mkdirSync, readFileSync } from 'node:fs'

const BASE = ''
function contrastRatio(foreground: string, background: string): number {
  const luminance = (color: string) => {
    const rgb = color.replace(/^rgba?\(/, '').split(',').slice(0, 3).map(channel => Number.parseFloat(channel.trim()))
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

  for(const width of [390,1440]){
    test(`owned NFT #75 at ${width}px: search, price reset and unsigned preparation`,async({page})=>{
      const address='erd1'+'q'.repeat(58)
      const rows=Array.from({length:100},(_,i)=>{
        const nonce=i+1,hex=nonce.toString(16).padStart(2,'0')
        return {identifier:'ART-abcdef-'+hex,collection:'ART-abcdef',nonce,
          name:'Sculpture '+String(nonce).padStart(3,'0'),balance:'1',type:'NonFungibleESDT',
          uris:['ipfs://Qm'+'a'.repeat(44)]}
      })
      let transactions=0,ownershipReads=0
      page.on('request',request=>{
        if(request.method()==='POST'&&/\/transactions(?:\?|$)/.test(request.url()))transactions++
      })
      await page.addInitScript(address=>localStorage.setItem('xartists_wallet',JSON.stringify({
        connected:true,address,method:'paste_readonly',
      })),address)
      await page.route('https://api.multiversx.com/**',route=>{
        const url=new URL(route.request().url()),base='/accounts/'+address
        const headers={'access-control-allow-origin':'*'}
        if(url.pathname===base+'/nfts')return route.fulfill({headers,json:rows})
        if(url.pathname===base+'/tokens')return route.fulfill({headers,json:[]})
        if(url.pathname===base)return route.fulfill({headers,json:{balance:'1000000000000000000',nonce:0}})
        if(url.pathname.startsWith(base+'/nfts/'))ownershipReads++
        return route.fulfill({status:503,headers,json:{error:'fixture_unavailable'}})
      })
      await page.setViewportSize({width,height:900})
      await visit(page,'/marketplace/?lang=fr')
      await page.locator('.xa-market-depth > summary').click()
      const seller=page.locator('#xa-market-sell')
      const search=seller.locator('#xa-owned-nft-search')
      await expect(seller.getByRole('button',{name:'Préparer la mise en vente',exact:true})).toHaveCount(48)
      await search.fill('Sculpture 075')
      await expect(seller.getByRole('button',{name:'Préparer la mise en vente',exact:true})).toHaveCount(1)
      await seller.getByRole('button',{name:'Préparer la mise en vente',exact:true}).click()
      let dialog=page.getByRole('dialog',{name:'Sculpture 075'})
      await expect(dialog).toBeVisible()
      const price=dialog.getByPlaceholder('Saisir un prix en EGLD')
      await expect(price).toHaveValue('')
      await price.fill('1.25')
      await expect(dialog.getByRole('button',{name:'Vérifier frais et royalties'})).toBeDisabled()
      await page.screenshot({animations:'disabled',path:`artifacts/ux-mobile/owned-nft-75-${width}.png`})
      await dialog.getByRole('button',{name:'Annuler',exact:true}).click()
      await search.fill('Sculpture 076')
      await seller.getByRole('button',{name:'Préparer la mise en vente',exact:true}).click()
      dialog=page.getByRole('dialog',{name:'Sculpture 076'})
      await expect(dialog.getByPlaceholder('Saisir un prix en EGLD')).toHaveValue('')
      await expect(dialog.getByRole('button',{name:'Vérifier frais et royalties'})).toBeDisabled()
      expect(transactions).toBe(0)
      expect(ownershipReads).toBe(0)

      await visit(page,'/marketplace/?lang=fr&list=ART-abcdef-4b')
      dialog=page.getByRole('dialog',{name:'Sculpture 075'})
      await expect(dialog).toBeVisible()
      await expect(dialog.getByPlaceholder('Saisir un prix en EGLD')).toHaveValue('')
      await expect(dialog.getByRole('button',{name:'Vérifier frais et royalties'})).toBeDisabled()
      await dialog.getByRole('button',{name:'Annuler',exact:true}).click()
      await expect(page.getByRole('dialog',{name:'Sculpture 075'})).toHaveCount(0)
      expect(transactions).toBe(0)
      expect(ownershipReads).toBe(0)
    })
  }

  for(const [lang,width] of [['fr',390],['en',1440]] as const){
    test(`xOrus analysis product at ${width}px: derived findings and source outage (${lang})`,async({page})=>{
      await page.setViewportSize({width,height:900})
      const report=JSON.parse(readFileSync(new URL('../apps/frontend/public/data/xorus_analysis_preview.json',import.meta.url),'utf8'))
      // Deliberately unverified paper fixture, never a live provider assertion.
      report.coverage.signals_analyzed=1
      report.coverage.families_analyzed=1
      report.agents[1].status='paper_unverified'
      report.agents[1].families[0]={family:'price',signals_analyzed:1,reading:'negative'}
      report.provider_payload='private-provider-response-do-not-render'
      let unavailable=false
      await page.route('**/data/xorus_analysis_preview.json',route=>unavailable
        ?route.fulfill({status:503,body:'unavailable'})
        :route.fulfill({json:report}))
      await page.route('https://api.multiversx.com/economics*',route=>{
        // A hung optional quote must not hold back the analysis report.
        if(lang==='fr'&&!unavailable)return
        return route.fulfill({status:503,body:'unavailable'})
      })
      await visit(page,`/intelligence/xorus/?lang=${lang}`)
      const analysis=page.getByTestId('xorus-analysis-report')
      await expect(analysis).toContainText(lang==='fr'?'Les données collectées servent d’entrées internes':'Collected data are internal inputs')
      await expect(analysis).toContainText(lang==='fr'?'Hypothèses paper uniquement':'Paper hypotheses only')
      await analysis.locator('summary').click()
      await expect(analysis).toContainText(lang==='fr'?'lecture négative':'negative reading')
      await expect(analysis).toContainText(lang==='fr'?'Analyse indisponible':'Analysis unavailable')
      await expect(page.getByTestId('xorus-decision-desk')).toContainText(lang==='fr'?'S’ABSTENIR':'ABSTAIN')
      await expect(analysis).not.toContainText('private-provider-response-do-not-render')
      if(lang==='fr')await expect(page.getByRole('button',{name:'Actualiser les sources'})).toBeDisabled()
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(12)
      await page.screenshot({animations:'disabled',path:`artifacts/ux-mobile/xorus-analysis-${lang}-${width}.png`})
      unavailable=true
      await expect(page.getByRole('button',{name:lang==='fr'?'Actualiser les sources':'Check sources'})).toBeEnabled()
      await page.getByRole('button',{name:lang==='fr'?'Actualiser les sources':'Check sources'}).click()
      await expect(page.getByRole('button',{name:lang==='fr'?'Actualiser les sources':'Check sources'})).toBeEnabled()
      await expect(analysis).toContainText(lang==='fr'?'Rapport indisponible ou non conforme':'Report unavailable or invalid')
      await expect(analysis).not.toContainText(lang==='fr'?'lecture négative':'negative reading')
    })
  }

  for (const width of [360, 390, 430]) {
    test(`marketplace at ${width}px: artwork-first grid stays readable without wallet`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await visit(page, '/marketplace/?lang=fr')
      await expect(page.locator('.xa-market-depth')).not.toHaveAttribute('open','')
      await page.locator('.xa-market-depth > summary').click()
      // The artwork catalog replaces the marketing hero on the marketplace tab.
      await expect(page.locator('.xa-marketplace-hero')).toHaveCount(0)
      const title = page.locator('.xa-market-grid__heading h2')
      await expect(title).toHaveText('Œuvres à découvrir')
      const firstCard = page.locator('.xa-market-grid__card').first()
      // A marketplace with no verified inventory must render an honest empty state.
      // Never force unminted Drive originals into the grid just to satisfy this test.
      if (await firstCard.isVisible()) {
        const colors = await firstCard.evaluate(el => ({
          background: getComputedStyle(el).backgroundColor,
          title: getComputedStyle(el.querySelector('h3')!).color,
        }))
        expect(contrastRatio(colors.title, colors.background), 'market card title contrast').toBeGreaterThanOrEqual(4.5)
      } else {
        await expect(page.locator('.xa-market-grid__empty')).toBeVisible()
      }
      await expect(page.locator('.xa-market-grid').getByRole('searchbox')).toBeVisible()
      const categories = page.locator('.xa-marketplace-category')
      await expect(categories).toHaveCount(3)
      const navigationDisplay = await page.locator('.xa-marketplace-categories__grid').evaluate(el =>
        getComputedStyle(el).display)
      expect(navigationDisplay, 'compact horizontally scrolling marketplace categories').toBe('flex')
      await expect(page.locator('.xa-market-grid__drive-mint a')).toHaveAttribute('href', /studio/)
      await expect(page.locator('.xa-market-grid img[src*="/art/drive/"]')).toHaveCount(0)
      await expect(page.locator('.xa-market-tech').first()).not.toHaveAttribute('open', '')
      const grid = page.locator('.xa-market-grid__cards')
      if (await grid.isVisible()) {
        const columns = await grid.evaluate(el =>
          getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length)
        expect(columns, 'two NFT columns on mobile').toBe(2)
      } else {
        await expect(page.locator('.xa-market-grid__empty')).toBeVisible()
      }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
      expect(overflow, `Marketplace horizontal overflow at ${width}px`).toBeLessThanOrEqual(12)
      await page.screenshot({ animations: 'disabled', path: `artifacts/ux-mobile/marketplace-editorial-${width}.png` })
      await categories.nth(1).click()
      await expect(page).toHaveURL(/tab=rwa/)
    })
  }

  test('NFT catalogue filters work without a wallet or pretending Drive originals are tokens', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await visit(page, '/marketplace/?lang=fr')
    await page.locator('.xa-market-depth > summary').click()
    const gallery = page.locator('.xa-market-grid')
    await expect(gallery.getByRole('heading', { name: 'Œuvres à découvrir' })).toBeVisible()
    await expect(gallery.locator('.xa-market-grid__drive-mint a[href*="/studio"]')).toBeVisible()
    await expect(gallery.locator('img[src*="/art/drive/"]')).toHaveCount(0)
    await expect(gallery.getByRole('button', { name: 'Atelier xArtists' })).toHaveCount(0)
    await expect(gallery.getByRole('button', { name: 'NFT MultiversX' })).toBeVisible()
    await expect(gallery.getByRole('button', { name: 'Index externe' })).toBeVisible()
    await expect(gallery.getByRole('button', { name: /Acheter|Buy now|Enchérir/i })).toHaveCount(0)
    await gallery.getByRole('searchbox').fill('original-drive-not-minted')
    await expect(gallery.locator('.xa-market-grid__card')).toHaveCount(0)
    await gallery.getByRole('searchbox').fill('')
    await gallery.getByRole('button', { name: 'NFT MultiversX' }).click()
    await expect(gallery.getByRole('button', { name: 'NFT MultiversX' })).toHaveAttribute('aria-pressed','true')
    await gallery.getByRole('button', { name: 'Tout voir' }).click()
  })

  for (const [width, expectedColumns] of [[768, 3], [1440, 4]] as const) {
    test(`NFT catalog at ${width}px is responsive even when the chain index is empty`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await visit(page, '/marketplace/?lang=fr')
      await page.locator('.xa-market-depth > summary').click()
      const cards = page.locator('.xa-market-grid__cards')
      await expect(page.locator('.xa-market-grid')).toBeVisible()
      await expect(page.locator('.xa-market-grid img[src*="/art/drive/"]')).toHaveCount(0)
      if (await cards.isVisible()) {
        const columns = await cards.evaluate(el =>
          getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length)
        expect(columns, 'responsive NFT grid columns').toBe(expectedColumns)
      } else {
        await expect(page.locator('.xa-market-grid__empty')).toBeVisible()
      }
      await expect(page.locator('.xa-marketplace-hero')).toHaveCount(0)
    })
  }

  test('marketplace visitor entry respects all eight selected languages', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const cases: Array<[string,string,string]> = [
      ['fr','Œuvres à découvrir','Art numérique'],
      ['en','Explore artworks','Digital art'],
      ['es','Explorar obras','Arte digital'],
      ['de','Kunstwerke entdecken','Digitale Kunst'],
      ['ru','Открыть работы','Цифровое искусство'],
      ['uk','Відкрити роботи','Цифрове мистецтво'],
      ['zh','探索艺术作品','数字艺术'],
      ['ar','استكشف الأعمال','الفن الرقمي'],
    ]
    for (const [lang, title, category] of cases) {
      await visit(page, '/marketplace/?lang=' + lang)
      await page.locator('.xa-market-depth > summary').click()
      await expect(page.locator('.xa-market-grid__heading h2')).toContainText(title)
      const tabs = page.locator('.xa-marketplace-category')
      await expect(tabs).toHaveCount(3)
      await expect(tabs.first()).toContainText(category)
      await expect(page.locator('html')).toHaveAttribute('lang', lang)
      await expect(page.locator('html')).toHaveAttribute('dir', lang==='ar'?'rtl':'ltr')
      await expect(page.locator('.xa-marketplace-status')).toBeVisible()
      const overflow=await page.evaluate(() => document.documentElement.scrollWidth-innerWidth)
      expect(overflow, 'Localized marketplace overflow for '+lang).toBeLessThanOrEqual(12)
    }
  })

  for (const width of [390, 1440]) {
    test('NFT Factory guided flow at '+width+'px: create, verify and publish remain clear', async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await visit(page, '/create/nft-factory')
      const factory = page.locator('[data-testid="nft-factory-paper"]')
      await expect(factory).toBeVisible()
      const steps = page.getByRole('navigation', { name: 'Étapes de création NFT' })
      await expect(steps.getByRole('button')).toHaveCount(3)
      await expect(steps.getByRole('button', { name: /1\. Créer/ })).toHaveAttribute('aria-current', 'step')
      await expect(page.getByRole('heading', { name: '1. Imaginez votre collection' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Déclaration des droits' })).toHaveCount(0)
      await expect(page.getByText('Réglages avancés (agents, paramètres, devis simulé)')).toBeVisible()
      await expect(page.getByRole('button', { name: /Payer et générer/ })).toHaveCount(0)
      await steps.getByRole('button', { name: /2\. Vérifier/ }).click()
      await expect(page.getByRole('heading', { name: '2. Vérifiez votre œuvre' })).toBeVisible()
      await expect(page.getByRole('checkbox', { name: /Je confirme disposer des droits/ })).toBeVisible()
      await expect(page.getByLabel(/Votre photo, vidéo ou sculpture 3D/)).toBeVisible()
      await expect(page.getByRole('button', { name: 'Vérifier mon fichier' })).toBeDisabled()
      await steps.getByRole('button', { name: /3\. Publier/ }).click()
      await expect(page.getByRole('heading', { name: '3. Préparez votre publication' })).toBeVisible()
      await expect(page.getByText(/Publication non disponible ici/)).toBeVisible()
      await expect(page.getByRole('link', { name: 'Poursuivre dans Creator Studio' })).toBeVisible()
      await expect(page.getByRole('button', { name: /Déployer mon SC/ })).toHaveCount(0)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow, 'NFT Factory overflow at '+width+'px').toBeLessThanOrEqual(12)
      await page.screenshot({ animations: 'disabled', path: 'artifacts/ux-mobile/nft-factory-publish-'+width+'.png' })
    })
  }

  for (const width of [390, 1440]) {
    test(`optional TRO and RWA detail opens by keyboard at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await visit(page, '/finance/tro/sale/?lang=fr')
      const roadmap = page.locator('#tro-roadmap-details-trigger')
      const summary = roadmap.locator(':scope > summary')
      await expect(roadmap).not.toHaveAttribute('open', '')
      await expect(page.locator('.tro-portal__availability')).toHaveText('Bridge et vente directe fermés')
      await expect(page.getByRole('button', { name: /bridge|acheter|déposer/i })).toHaveCount(0)
      await summary.press('Enter')
      await expect(roadmap).toHaveAttribute('open', '')
      await expect(page.locator('#tro-transparency')).toBeVisible()
      await expect(page.locator('#tro-transparency')).toContainText('Aucun achat, transfert ou dépôt')
      await summary.press('Space')
      await expect(page.locator('#tro-transparency')).toBeHidden()

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
    test(`mobile ${width}px: no auto-WebGL and five discover-first mobile destinations`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await visit(page, '/')
      await expect(page.locator('.xa-mobile-dock')).toBeVisible()
      await expect(page.locator('.xa-mobile-dock a')).toHaveCount(5)
      await expect(page.locator('.xa-first-hero')).toBeVisible()
      await expect(page.locator('.xa-first-tile')).toHaveCount(4)
      await expect(page.locator('.xa-first-hero canvas')).toHaveCount(0)
      for (const path of ['/marketplace', '/studio', '/intelligence/xorus', '/finance', '/wallet']) {
        await expect(page.locator(`.xa-mobile-dock a[href*="${path}"]`)).toHaveCount(1)
      }
      const menu = page.locator('.xa-mobile-trigger')
      await menu.click()
      await page.locator('.xa-mobile-advanced summary').click()
      await expect(page.locator('.xa-mobile-menu a[href*="/explore/auction"]')).toBeVisible()
      await expect(page.locator('.xa-mobile-menu a[href*="/finance/governance"]')).toBeVisible()
      await expect(page.locator('.xa-mobile-menu a[href*="/create/world-rights"]')).toBeVisible()
      await page.keyboard.press('Escape')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
      expect(overflow, `Home horizontal overflow at ${width}px: ${overflow}px`).toBeLessThanOrEqual(12)
      await page.screenshot({ animations: 'disabled', path: `artifacts/ux-mobile/home-${width}.png` })
    })
  }

  for (const width of [360, 390, 430]) {
    test(`museum at ${width}px: modes are clear, keyboard-accessible and do not overflow`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await visit(page, '/museum')
      const museum = page.locator('.xa-museum-page')
      await expect(museum).toBeVisible()
      const modes = page.getByRole('group', { name: 'Parcours du musée' })
      const buttons = modes.getByRole('button')
      await expect(buttons).toHaveCount(5)
      await expect(buttons.first()).toHaveAttribute('aria-pressed', 'true')
      const touchHeight = await buttons.first().evaluate(el => el.getBoundingClientRect().height)
      expect(touchHeight, 'museum mode control must be at least 44px high').toBeGreaterThanOrEqual(44)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
      expect(overflow, `museum overflow at ${width}px`).toBeLessThanOrEqual(12)
      await page.screenshot({ animations: 'disabled', path: `artifacts/ux-mobile/museum-${width}.png` })
      const skip = page.getByRole('link', { name: 'Accéder directement à la visite' })
      await expect(skip).toBeVisible()
      await skip.click()
      await expect(modes).toBeVisible()
      const scene = page.locator('.xa-museum-stage, .xa-museum-page [role="application"]').first()
      await expect(scene).toBeAttached({ timeout: 20000 })
      await scene.scrollIntoViewIfNeeded()
      await page.screenshot({ animations: 'disabled', path: `artifacts/ux-mobile/museum-stage-${width}.png` })
      const webglButton = scene.locator('.xa-museum-hud-actions button').first()
      if (await webglButton.count()) {
        const height = await webglButton.evaluate(el => el.getBoundingClientRect().height)
        expect(height, 'immersive museum HUD target must be 44px high').toBeGreaterThanOrEqual(44)
      }
      await buttons.nth(2).focus()
      await buttons.nth(2).press('Enter')
      await expect(buttons.nth(2)).toHaveAttribute('aria-pressed', 'true')
    })
  }

  test('museum at 390px: blank WebGL can be replaced by real artwork CSS 3D and restored', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await visit(page, '/museum')
    await page.getByRole('link', { name: 'Accéder directement à la visite' }).click()
    const switcher = page.getByRole('group', { name: 'Mode d’affichage du musée' })
      .getByRole('button')
    await expect(switcher).toBeVisible({ timeout: 25000 })
    await expect(switcher).toHaveAttribute('aria-pressed', 'false')
    await switcher.click()
    await expect(switcher).toHaveAttribute('aria-pressed', 'true')
    const fallback = page.locator('.xa-museum-page [role="application"][aria-label^="Salle 3D"]')
    await expect(fallback).toBeVisible()
    const artworks = fallback.locator('[data-art]')
    await expect(artworks.first()).toBeAttached()
    await expect(artworks.first().locator('img')).toBeAttached()
    await expect(page.locator('.xa-museum-stage')).toHaveCount(0)
    await switcher.click()
    await expect(switcher).toHaveAttribute('aria-pressed', 'false')
    await expect(page.locator('.xa-museum-stage')).toBeVisible({ timeout: 25000 })
    await page.screenshot({ animations: 'disabled',
      path: 'artifacts/ux-mobile/museum-webgl-recovery-390.png' })
  })

  test('touch museum at 390px: joystick and fullscreen controls remain reachable', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    })
    try {
      const page = await context.newPage()
      await visit(page, '/museum')
      await page.getByRole('link', { name: 'Accéder directement à la visite' }).click()
      const stage = page.locator('.xa-museum-stage')
      await expect(stage).toBeVisible({ timeout: 20000 })
      await stage.scrollIntoViewIfNeeded()
      const fullscreen = stage.getByRole('button', { name: /plein écran|full screen/i })
      await expect(fullscreen).toBeVisible()
      const hudHeight = await fullscreen.evaluate(el => el.getBoundingClientRect().height)
      expect(hudHeight).toBeGreaterThanOrEqual(44)
      const joystick = stage.locator('.xa-museum-joystick')
      await expect(joystick).toBeVisible()
      const stick = await joystick.boundingBox()
      const dock = await page.locator('.xa-mobile-dock').boundingBox()
      expect(stick && dock, 'joystick and dock should be measurable').toBeTruthy()
      if (stick && dock) {
        expect(stick.y + stick.height, 'joystick must not hide under mobile dock').toBeLessThan(dock.y)
        const bottomHud = await stage.locator('.xa-museum-bottom-hud').boundingBox()
        expect(bottomHud, 'the inspect/walk HUD should be present').toBeTruthy()
        if (bottomHud) {
          expect(bottomHud.y + bottomHud.height, 'inspect/walk HUD must not hide under mobile dock').toBeLessThan(dock.y)
        }
      }
      await page.screenshot({ animations: 'disabled', path: 'artifacts/ux-mobile/museum-touch-stage-390.png' })
    } finally {
      await context.close()
    }
  })

  test('desktop 1440px Home remains navigable, without wallet', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await visit(page, '/')
    await expect(page.locator('.xa-primary-rail')).toBeVisible()
    await expect(page.locator('.xa-first-hero')).toBeVisible()
    await expect(page.locator('.xa-first-tile')).toHaveCount(4)
    await expect(page.locator('a[href*="marketplace"], a[href*="/explore/market"]').first()).toBeVisible()
    await page.screenshot({ animations: 'disabled', path: 'artifacts/ux-mobile/home-desktop-1440.png' })
  })

  test('light-first theme toggle is visible and dark preference survives reload', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await visit(page, '/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    await expect.poll(()=>page.locator('.xa-connect').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(113, 56, 200)')
    const toggle = page.locator('.xa-theme-toggle')
    await expect(toggle).toBeVisible()
    await toggle.click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect.poll(()=>page.locator('.xa-connect').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(198, 162, 250)')
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
      await expect(page.locator('.xa-roadmap-milestone')).toHaveCount(5)
      await expect(page.locator('.xa-roadmap-milestone a[href*="/issues/"]')).toHaveCount(5)
      await expect(page.locator('.xa-roadmap-note')).toBeVisible()
      await expect(page.locator('.xa-mobile-dock')).toHaveCount(1)
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)
      expect(overflow, `roadmap horizontal overflow at ${width}px`).toBeLessThanOrEqual(12)
      await page.screenshot({animations:'disabled',path:`artifacts/ux-mobile/roadmap-${width}.png`})
    }
  })

  test('home personal entry is useful on desktop and mobile without a decorative scene or wallet prompt', async ({ page }) => {
    await page.setViewportSize({width:1440,height:900})
    await visit(page,'/?lang=fr')
    await expect(page.locator('.xa-orbital-stage')).toHaveCount(0)
    await expect(page.locator('.xa-first-hero canvas')).toHaveCount(0)
    await expect(page.locator('.xa-home-personal')).toBeVisible()
    await page.emulateMedia({reducedMotion:'reduce'})
    await page.setViewportSize({width:390,height:844})
    await expect(page.locator('.xa-home-personal')).toBeVisible()
    await expect(page.locator('.xa-mobile-dock')).toBeVisible()
    await page.locator('.xa-home-personal').click()
    await expect(page).toHaveURL(/\/workspace\/wallet/)
    await expect(page.locator('.xa-cockpit-hero')).toBeVisible()
    await expect(page.locator('[role="dialog"]')).toHaveCount(0)
  })

  test('phone screenshots: compact connected-wallet header always exposes menu and music via dialog', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('xartists_wallet', JSON.stringify({connected:true,address:'erd1'+'q'.repeat(58),method:'paste_readonly'})))
    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 })
      await visit(page, '/auction/?lang=fr')
      const header = page.locator('.xa-header-inner')
      await expect(header).toBeVisible()
      const menu = page.locator('.xa-mobile-trigger')
      await expect(menu).toBeVisible()
      await expect(page.locator('.xa-connect svg')).toBeVisible()
      await expect(page.locator('.xa-connect span')).toBeHidden()
      await expect(page.locator('.xa-connect')).toHaveAttribute('aria-label', 'Mon wallet')
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
    const guideColors = await guideNotice.evaluate(el => {
      const probe = document.createElement('span')
      probe.style.color = 'var(--xa-bg)'
      el.append(probe)
      const background = getComputedStyle(probe).color
      probe.remove()
      return { foreground: getComputedStyle(el).color, background }
    })
    expect(contrastRatio(guideColors.foreground, guideColors.background), 'guide copy must contrast with the light background').toBeGreaterThanOrEqual(4.5)
  })

  test('phone screenshots: NFT factory layers and inputs do not escape viewport', async ({ page }) => {
    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 844 })
      await visit(page, '/nft-factory/')
      await expect(page.locator('.xa-nft-factory')).toBeVisible()
      await page.getByLabel('Mode de design').selectOption('layers')
      await expect(page.locator('.xa-nft-variant-row').first()).toBeVisible()
      const steps = page.getByRole('navigation', { name: 'Étapes de création NFT' })
      await steps.getByRole('button', { name: /2\. Vérifier/ }).click()
      const rights = page.getByRole('checkbox', { name: /Je confirme disposer des droits/ })
      await expect(rights).toBeVisible()
      expect(await rights.evaluate(el => el.getBoundingClientRect().width)).toBeLessThan(32)
      await steps.getByRole('button', { name: /1\. Créer/ }).click()
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
    expect(await card.evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(241, 237, 249)')
    await page.screenshot({ animations: 'disabled', path: 'artifacts/ux-mobile/staking-pool-contrast-390.png' })
  })

  test('visitor guide at 390px never links to retired Slot, and offers legal access', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await visit(page, '/guide/')
    await expect(page.getByRole('heading', { name: /quatre étapes|four steps/i })).toBeVisible()
    await expect(page.locator('main h1')).toHaveCount(1)
    await expect(page.locator('a[href*="/slot"]')).toHaveCount(0)
    await expect(page.locator('.xa-guide-steps a')).toHaveCount(4)
    for (const path of ['/museum', '/create/gallery', '/studio', '/marketplace']) {
      await expect(page.locator(`.xa-guide-steps a[href*="${path}"]`)).toBeVisible()
    }
    const advancedGuide = page.locator('.xa-guide-advanced')
    await expect(advancedGuide).not.toHaveAttribute('open', '')
    await advancedGuide.locator('summary').press('Enter')
    await expect(advancedGuide).toHaveAttribute('open', '')
    for (const path of ['/dao', '/auction', '/lia', '/offres', '/legal']) {
      await expect(advancedGuide.locator(`a[href*="${path}"]`)).toBeVisible()
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    expect(overflow, 'guide horizontal overflow at 390px').toBeLessThanOrEqual(12)
    await page.screenshot({ animations: 'disabled', fullPage: true, path: 'artifacts/ux-mobile/guide-390.png' })
  })

  test('mobile menu reveals beginner actions, then optional specialist tools by keyboard', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await visit(page, '/')
    await page.locator('.xa-mobile-trigger').click()
    await expect(page.locator('.xa-mobile-start')).toBeVisible()
    for (const path of ['/marketplace', '/studio', '/intelligence/xorus', '/finance', '/wallet']) {
      await expect(page.locator(`.xa-mobile-start a[href*="${path}"]`)).toBeVisible()
    }
    const advancedMenu = page.locator('.xa-mobile-advanced')
    await expect(advancedMenu).not.toHaveAttribute('open', '')
    await advancedMenu.locator('summary').press('Enter')
    await expect(advancedMenu).toHaveAttribute('open', '')
    await expect(advancedMenu.locator('a[href*="/finance/governance"]')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('.xa-mobile-menu')).toBeHidden()
  })

  test('module directory exposes five beginner paths including gallery while retaining filtered catalogue', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await visit(page, '/directory/')
    await expect(page.locator('.xa-directory-starter')).toHaveCount(5)
    await expect(page.locator('.xa-directory-starter[href*="/wallet"]')).toBeVisible()
    await expect(page.locator('.xa-directory-page a[href*="/create/gallery"]')).toBeVisible()
    await expect(page.locator('.xa-directory-page .xa-module-card').first()).toBeVisible()
    await page.locator('.xa-directory-options > summary').click()
    await expect(page.locator('.xa-directory-stage-controls')).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
    expect(overflow, 'directory horizontal overflow at 390px').toBeLessThanOrEqual(12)
  })

  test('previous crashing Hatom and Support route render headings without provider error', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    for (const [path, label] of [
      ['/finance/hatom/', /Hatom Protocol/i],
      ['/finance/support/', /Soutenir xArtists|Support xArtists/i],
    ] as const) {
      await visit(page, path)
      await expect(page.getByRole('heading', { name: label }).last()).toBeVisible()
      await expect(page.getByText('Page unavailable')).toHaveCount(0)
      await expect(page.getByText(/must be used inside MultiversXProvider/)).toHaveCount(0)
    }
  })

  test('TRO/Solana informational portal loads directly and never exposes a deposit', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await visit(page, '/finance/tro/sale/?lang=fr')
    await expect(page.locator('#tro-hero-title')).toBeVisible()
    await expect(page.locator('.tro-portal__availability')).toHaveText('Bridge et vente directe fermés')
    await expect(page.locator('.xa-token-networks .xa-token-network')).toHaveCount(2)
    await expect(page.getByRole('button', { name: /bridge|acheter|déposer/i })).toHaveCount(0)
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
  test('RWA and $TRO headings contrast with default light and optional dark theme',async ({page})=>{
    await page.setViewportSize({width:390,height:844})
    for(const [path,selector] of [['/explore/rwa/','.rwa-public__lead h1'],['/finance/tro/sale/','#tro-hero-title']] as const){
      await visit(page,path)
      // On 390px mobile the header theme toggle is deliberately hidden.
      // Exercise the actual accessible theme control inside the mobile menu.
      await page.locator('.xa-mobile-trigger').click()
      const mobileTheme = page.locator('.xa-mobile-preferences .xa-button').first()
      await expect(mobileTheme).toBeVisible()
      for(const theme of ['light','dark'] as const){
        await expect(page.locator('html')).toHaveAttribute('data-theme',theme)
        // The app intentionally fades body background over .24s. Verify the
        // settled theme instead of racing an in-progress color transition.
        await expect.poll(async ()=>{
          const colors=await page.locator(selector).evaluate(el=>({
            ink:getComputedStyle(el).color,paper:getComputedStyle(document.body).backgroundColor
          }))
          return contrastRatio(colors.ink,colors.paper)
        },{message:path+' '+theme+' settled contrast',timeout:3000}).toBeGreaterThanOrEqual(7)
        if(theme==='light')await mobileTheme.click()
      }
      await mobileTheme.click()
      await expect(page.locator('html')).toHaveAttribute('data-theme','light')
      await expect(page.locator('main')).toHaveCount(1)
    }
  })

  test('mobile RWA and $TRO anchor links reveal safe information without horizontal overflow',async ({page})=>{
    await page.emulateMedia({reducedMotion:'reduce'})
    for(const width of [360,390,430]){
      await page.setViewportSize({width,height:844})
      await visit(page,'/explore/rwa/')
      await expect(page.locator('.rwa-public__quicknav a')).toHaveCount(4)
      await expect(page.getByText(/Catalogue de démonstration/).first()).toBeVisible()
      await page.locator('.rwa-public__quicknav a[href="#rwa-tools"]').click()
      await expect(page).toHaveURL(/#rwa-tools$/)
      await expect(page.locator('#rwa-preparation-trigger')).toHaveAttribute('aria-expanded','false')
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),'RWA overflow '+width).toBeLessThanOrEqual(12)
      await visit(page,'/finance/tro/sale/?lang=fr')
      await expect(page.locator('.xa-token-networks .xa-token-network')).toHaveCount(2)
      await expect(page.locator('.tro-portal__availability')).toContainText('Bridge et vente directe fermés')
      const details=page.locator('#tro-roadmap-details-trigger')
      await expect(details).not.toHaveAttribute('open','')
      await details.locator('summary').press('Enter')
      await expect(details).toHaveAttribute('open','')
      await expect(page.locator('#tro-transparency')).toContainText('Aucun achat, transfert ou dépôt')
      await expect(page.getByRole('button',{name:/bridge|acheter/i})).toHaveCount(0)
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),'TRO overflow '+width).toBeLessThanOrEqual(12)
    }
  })

  test('beginner guide is honestly four main choices in French, Spanish and Arabic RTL', async ({ page }) => {
    await page.setViewportSize({width:390,height:844})
    for(const [lang,title,dir] of [
      ['fr',/quatre étapes/i,'ltr'],
      ['es',/cuatro pasos/i,'ltr'],
      ['ar',/أربع خطوات/,'rtl'],
    ] as const) {
      await visit(page,'/guide/?lang='+lang)
      await expect(page.locator('html')).toHaveAttribute('lang',lang)
      await expect(page.locator('html')).toHaveAttribute('dir',dir)
      await expect(page.locator('.xa-guide-page h1')).toHaveText(title)
      await expect(page.locator('.xa-guide-steps a')).toHaveCount(4)
      await expect(page.locator('.xa-guide-advanced')).not.toHaveAttribute('open','')
      await expect(page.locator('.xa-guide-notice')).toBeVisible()
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth),'guide overflow '+lang).toBeLessThanOrEqual(12)
    }
  })

  test('global search matches a French term without accents, like the directory',async({page})=>{
    await page.setViewportSize({width:1440,height:900})
    await visit(page,'/guide/?lang=fr')
    await page.locator('.xa-search-trigger').click()
    const search=page.locator('.xa-search-dialog input[role="combobox"]')
    await expect(search).toBeVisible()
    await search.fill('musee')
    await expect(page.locator('.xa-search-results [role="option"]')).toHaveCount(1)
    await expect(page.locator('.xa-search-results')).toContainText('Expositions')
    await search.press('Enter')
    await expect(page).toHaveURL(/\/explore\/museum\/?/)
  })

  test('Home → Marketplace → Studio mainnet journey remains wallet-free to browse',async({page})=>{
    for(const width of [390,1440]){
      await page.setViewportSize({width,height:844})
      await page.emulateMedia({reducedMotion:'reduce'})
      await visit(page,'/?lang=fr')
      await page.locator('.xa-first-details > summary').click()
      const home=page.locator('[data-mainnet-journey="home"]')
      await expect(home).toBeVisible()
      await expect(home.locator('.xa-mainnet-journey-steps a')).toHaveCount(3)
      await expect(home.getByText('MultiversX · mainnet')).toBeVisible()
      await expect(home.getByRole('button',{name:'Connecter xPortal'})).toBeVisible()
      await expect(home.locator('a[href="https://explorer.multiversx.com/"]')).toHaveAttribute('target','_blank')
      await home.locator('a[href*="/marketplace"]').click()
      const market=page.locator('[data-mainnet-journey="market"]')
      await expect(market).toBeVisible()
      await expect(market.locator('a[aria-current="step"]')).toHaveCount(1)
      await expect(market.locator('a[aria-current="step"]')).toContainText('Marketplace')
      await market.locator('a[href*="/studio"]').click()
      await page.locator('.xa-studio-advanced > summary').click()
      const studio=page.locator('[data-mainnet-journey="studio"]')
      await expect(studio).toBeVisible()
      await expect(studio.locator('a[aria-current="step"]')).toContainText('Studio')
      await expect(studio.getByRole('button',{name:/xPortal/i})).toBeVisible()
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)
      expect(overflow,'journey width '+width).toBeLessThanOrEqual(12)
      await page.screenshot({animations:'disabled',
        path:`artifacts/ux-mobile/mainnet-journey-${width}.png`})
    }
  })


  test('xOrus paper terminal persists simulations and applies caps without wallet or order requests',async({page})=>{
    await page.setViewportSize({width:390,height:844})
    await visit(page,'/intelligence/xorus/?lang=fr&view=simulation')
    await page.evaluate(()=>localStorage.removeItem('xartists-xorus-paper-ledger-v1'))
    await page.reload()
    const terminal=page.getByTestId('xorus-paper-terminal')
    await expect(terminal).toContainText('100 USD virtuels')
    const requests:string[]=[]
    page.on('request',r=>{if(/\/v1\/xorus\/(execute|orders|swap|sign)|walletconnect|reown/.test(r.url()))requests.push(r.url())})
    await terminal.getByRole('button',{name:'Simuler une entrée',exact:true}).click()
    await expect(terminal).toContainText('Entrée virtuelle : 5.00 USD')
    await terminal.getByRole('button',{name:'Simuler une entrée',exact:true}).click()
    await expect(terminal.getByRole('alert')).toContainText('déjà ouverte sur ce réseau')
    await page.reload()
    await expect(terminal).toContainText('Entrée virtuelle : 5.00 USD')
    await terminal.getByLabel('Valeur fictive actuelle (USD)').fill('3.99')
    await terminal.getByRole('button',{name:'Simuler la valeur',exact:true}).click()
    await expect(terminal.getByRole('status')).toContainText('seuil d’arrêt')
    await terminal.getByRole('button',{name:'Clôturer la simulation',exact:true}).click()
    await expect(terminal).toContainText('Simulation clôturée · résultat fictif : -1.03 USD')
    await terminal.getByRole('button',{name:'Simuler une entrée',exact:true}).click()
    await expect(terminal.getByRole('alert')).toContainText('Seuil de pertes sur 24 h atteint')
    expect(requests).toEqual([])
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)
    expect(overflow).toBeLessThanOrEqual(12)
    await page.screenshot({animations:'disabled',path:'artifacts/ux-mobile/xorus-paper-terminal-390.png'})
  })

  test('Intelligence is readable on mobile: understand, agents, one local experiment',async({page})=>{
    await page.setViewportSize({width:390,height:844})
    await page.emulateMedia({reducedMotion:'reduce'})
    await visit(page,'/intelligence/xorus/?lang=fr')
    await expect(page.locator('.xa-intelligence-path')).toHaveCount(0)
    await page.locator('.xa-sidebar-toggle').click()
    const journey=page.locator('#xa-context-navigation')
    for(const path of ['/intelligence/xorus','/intelligence/agents','/workspace/agents','/intelligence/lab']){
      await expect(journey.locator('a[href="'+path+'"]')).toBeVisible()
    }
    await page.locator('.xa-sidebar-toggle').click()
    await expect(page.getByRole('heading',{name:'Analyses xOrus',level:1})).toBeVisible()
    await page.locator('.xa-xorus-page > .xa-task-details > summary').click()
    await expect(page.getByRole('button',{name:'Afficher les outils avancés'})).toHaveAttribute('aria-expanded','false')
    await expect(page.locator('#xorus-paybox-wallet')).toHaveCount(0)
    await page.screenshot({animations:'disabled',path:'artifacts/ux-mobile/intelligence-xorus-390.png'})

    await visit(page,'/intelligence/agents/?lang=fr')
    await expect(page.getByRole('heading',{name:'Les agents xOrus, simplement'})).toBeVisible()
    const packs=page.locator('details').filter({hasText:'Catalogue Genesis NFT (distinct des agents)'})
    await expect(packs).not.toHaveAttribute('open','')
    await expect(page.getByText('Médias NFT mainnet non prêts · achats suspendus')).toHaveCount(0)
    await page.screenshot({animations:'disabled',path:'artifacts/ux-mobile/intelligence-agents-390.png'})

    await visit(page,'/intelligence/lab/?lang=fr')
    await expect(page.getByRole('heading',{name:'Le laboratoire xOrus'})).toBeVisible()
    await expect(page.getByRole('button',{name:'Analyse xOrus'})).toHaveAttribute('aria-pressed','true')
    await expect(page.getByTestId('xorus-decision-desk')).toContainText('S’ABSTENIR')
    await page.getByRole('button',{name:'Simulation'}).click()
    await expect(page.getByRole('radio',{name:'Marché variable'})).toBeChecked()
    await page.getByRole('radio',{name:'Marché calme'}).check()
    await expect(page.getByText('Variation inventée')).toBeVisible()
    await expect(page.getByText(/Simulation locale uniquement/)).toBeVisible()
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)
    expect(overflow,'Intelligence horizontal overflow at 390px').toBeLessThanOrEqual(12)
    await page.screenshot({animations:'disabled',path:'artifacts/ux-mobile/intelligence-lab-390.png'})
  })

  test('direct /lab network and simulation views render without lazy CSS preload failure',async({page})=>{
    await page.setViewportSize({width:390,height:844})
    await visit(page,'/lab?view=network&lang=fr')
    const lab=page.locator('.xa-lab')
    await expect(lab).toBeVisible({timeout:20000})
    await expect(lab.getByRole('heading',{name:'Le laboratoire xOrus'})).toBeVisible()
    await expect(lab.getByRole('button',{name:'Connexions'})).toHaveAttribute('aria-pressed','true')
    await expect(lab.locator('.xa-lab-switch')).toHaveCSS('display','grid')
    await expect(page.getByText('Page unavailable')).toHaveCount(0)
    await lab.getByRole('button',{name:'Simulation'}).click()
    await expect(page).toHaveURL(/view=simulation/)
    await expect(lab.getByRole('button',{name:'Simulation'})).toHaveAttribute('aria-pressed','true')
    await expect(lab.getByText('Simulation pédagogique')).toBeVisible()
    await expect(lab.getByText(/Simulation locale uniquement/)).toBeVisible()
    await expect(page.getByText('Page unavailable')).toHaveCount(0)
  })

  test('canonical Studio deep link has its light-first styles before any wallet action',async({page})=>{
    for(const path of ['/create/studio/','/studio/']){
      await page.setViewportSize({width:390,height:844})
      await visit(page,path)
      await expect(page.locator('.xa-creator-studio')).toBeVisible()
      await expect(page.locator('.xa-studio-advanced')).not.toHaveAttribute('open','')
      await page.locator('.xa-studio-advanced > summary').click()
      await expect(page.locator('.xa-creator-studio .xa-studio-steps')).toHaveCSS('display','grid')
      await expect(page.locator('[data-mainnet-journey="studio"]')).toBeVisible()
      await expect(page.locator('.xa-not-found')).toHaveCount(0)
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)
      expect(overflow,'studio direct link '+path).toBeLessThanOrEqual(12)
    }
  })


})

test('task navigation follows wallet, access and creator aliases without conflating ownership',async({page})=>{
 await page.setViewportSize({width:1440,height:900})
 await visit(page,'/my-packs/?lang=fr')
 await expect(page.locator('.xa-primary-rail .xa-rail-navigation a[aria-current="page"]')).toHaveText('Agents & IA')
 await expect(page.locator('main h1')).toHaveCount(1)
 await expect(page.locator('.xa-module-sidebar a[href="/workspace/agents"]')).toHaveAttribute('aria-current','page')
 await visit(page,'/create/gallery/?lang=fr')
 await expect(page.locator('.xa-primary-rail .xa-rail-navigation a[aria-current="page"]')).toHaveText('Studio')
 await expect(page.locator('.xa-module-sidebar a[href="/create/world-rights"]')).toBeVisible()
 await page.setViewportSize({width:390,height:844})
 await visit(page,'/portfolio/?lang=fr')
 await expect(page).toHaveURL(/\/workspace\/wallet\?.*view=assets/)
 await expect(page.locator('.xa-wallet-views button[aria-current="page"]')).toHaveText('Tokens')
 await expect(page.locator('.xa-mobile-dock a[aria-current="page"]')).toHaveAttribute('href','/wallet')
 await expect(page.locator('main h1')).toHaveCount(1)
 await expect(page.locator('.xa-cockpit-hero')).toBeVisible()
 await expect(page.locator('[role="dialog"]')).toHaveCount(0)
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(12)
 await page.screenshot({animations:'disabled',path:'artifacts/ux-mobile/wallet-architecture-390.png'})
})

test('legacy laboratory and agent shelf links retain query context in their shared destinations',async({page})=>{
 for(const [path,view] of [['/sim','simulation'],['/entities','network']]){
  await visit(page,path+'/?lang=fr&from=legacy')
  await expect(page).toHaveURL(new RegExp('/intelligence/lab\\?.*view='+view))
  expect(new URL(page.url()).searchParams.get('lang')).toBe('fr')
  expect(new URL(page.url()).searchParams.get('from')).toBe('legacy')
  await expect(page.locator('.xa-lab-switch button[aria-pressed="true"]')).toHaveText(view==='simulation'?'Simulation':'Connexions')
 }
 await visit(page,'/marketplace/?tab=packs&lang=fr')
 await expect(page).toHaveURL(/\/intelligence\/agents\?/)
 await expect(page.getByRole('heading',{name:'Les agents xOrus, simplement'})).toBeVisible()
 await expect(page.locator('.xa-marketplace-category')).toHaveCount(0)
})


for(const theme of ['light','dark'] as const){
 for(const width of [390,1440]){
  test(`wallet cockpit stays readable with ${theme} preference at ${width}px`,async({page})=>{
   await page.addInitScript(theme=>localStorage.setItem('xa-theme',theme),theme)
   await page.setViewportSize({width,height:900})
   await page.emulateMedia({reducedMotion:'reduce'})
   await visit(page,'/wallet/?lang=fr')
   await expect(page.locator('.xa-cockpit-hero')).toBeVisible()
   await expect(page.locator('html')).toHaveAttribute('data-theme',theme)
   await expect(page.locator('main')).toHaveCSS('background-color','rgb(13, 9, 21)')
   const colors=await page.evaluate(()=>[
    '.xa-cockpit-title-row h1','.xa-cockpit-ai h2','.xa-cockpit-agent-text strong',
    '.xa-cockpit-agent-text small','.xa-cockpit-notice','.xa-wallet-views button',
   ].map(selector=>{
    const element=document.querySelector(selector)!
    let surface:Element|null=element,background=''
    while(surface){
     background=getComputedStyle(surface).backgroundColor
     if(background!=='rgba(0, 0, 0, 0)'&&background!=='transparent')break
     surface=surface.parentElement
    }
    return {selector,foreground:getComputedStyle(element).color,background}
   }))
   for(const color of colors)expect(contrastRatio(color.foreground,color.background),color.selector+' contrast').toBeGreaterThanOrEqual(4.5)
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(12)
   await page.screenshot({animations:'disabled',path:`artifacts/ux-mobile/clarity-wallet-${theme}-${width}.png`})
  })
 }
}

test('approved art gallery uses source-linked pieces and studio preview remains local-only', async ({page})=>{
 await page.setViewportSize({width:1440,height:900})
 await visit(page,'/marketplace/?lang=fr')
 await expect(page.locator('.xa-featured-gallery')).toBeVisible()
 await expect(page.locator('.xa-market-depth')).not.toHaveAttribute('open','')
 await expect(page.locator('main h1')).toHaveCount(1)
 await expect(page.locator('main h1')).toBeVisible()
 await expect(page.locator('.xa-featured-work')).toHaveCount(3)
 await expect(page.locator('.xa-featured-work h3').first()).toContainText('TRANSMUNDO 03')
 await expect(page.locator('.xa-featured-work h3').nth(1)).toContainText('BlackArtPass')
 await expect(page.locator('.xa-featured-work h3').nth(2)).toContainText('Line Up #03')
 await expect(page.locator('.xa-featured-gallery-disclaimer')).toContainText('archivé')
 await expect(page.locator('.xa-featured-work a[href*="explorer.multiversx.com/nfts/"]')).toHaveCount(6)
 await page.screenshot({animations:'disabled',path:'artifacts/ux-mobile/clarity-gallery-1440.png'})
 await page.setViewportSize({width:390,height:844})
 await expect(page.locator('main h1')).toBeVisible()
 await page.screenshot({animations:'disabled',path:'artifacts/ux-mobile/clarity-gallery-390.png'})
 await page.locator('.xa-market-depth > summary').click()
 await expect(page.locator('main h1')).toHaveCount(1)
 await expect(page.locator('#xa-market-grid-title')).toHaveJSProperty('tagName','H2')
 await page.setViewportSize({width:1440,height:900})
 await visit(page,'/studio/?lang=fr')
 await expect(page.locator('.xa-visual-studio')).toBeVisible()
 await expect(page.locator('.xa-studio-advanced')).not.toHaveAttribute('open','')
 await expect(page.locator('.xa-visual-studio-columns')).toHaveCSS('display','grid')
 await expect(page.locator('.xa-visual-studio-publication button')).toBeDisabled()
 await expect(page.locator('.xa-visual-studio-preview-label')).toContainText('exemple')
 await page.screenshot({animations:'disabled',path:'artifacts/ux-mobile/clarity-studio-1440.png'})
 const input=page.locator('.xa-visual-studio input[type="file"]')
 await input.setInputFiles({name:'test-art.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/B9sAAAAASUVORK5CYII=','base64')})
 await expect(page.locator('.xa-visual-studio-preview-label')).toContainText('local')
 await expect(page.locator('.xa-visual-studio-media-row')).toHaveCount(1)
 await page.locator('#xa-visual-work-title').fill('Ma création test')
 await expect(page.locator('.xa-visual-studio-publication button')).toBeDisabled()
 await page.reload()
 await expect(page.locator('#xa-visual-work-title')).toHaveValue('Ma création test')
 await expect(page.locator('.xa-visual-studio-media-row')).toHaveCount(0)
 await expect(page.locator('.xa-visual-studio-preview-label')).toContainText('exemple')
 await page.setViewportSize({width:390,height:844})
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)
 expect(overflow,'visual studio horizontal overflow').toBeLessThanOrEqual(12)
 await page.screenshot({animations:'disabled',path:'artifacts/ux-mobile/clarity-studio-390.png'})
})

test('focused support, DAO and token pages keep the initial mobile view concise',async({page})=>{
 await page.setViewportSize({width:390,height:844})
 await page.emulateMedia({reducedMotion:'reduce'})
 for(const [path,name,limit] of [['/finance/support/','support',140],['/finance/governance/','dao',180],['/finance/tro/sale/','token',180]] as const){
  await visit(page,path+'?lang=fr')
  await expect(page.locator('.xa-task-page')).toBeVisible()
  await expect(page.locator('main h1')).toHaveCount(1)
  const body=page.locator('.xa-task-page')
  const words=(await body.innerText()).trim().split(/\s+/).length
  expect(words,name+' default text density').toBeLessThan(limit)
  await expect(body.getByText('Services LIA',{exact:false})).toHaveCount(0)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(12)
  await page.screenshot({animations:'disabled',path:'artifacts/ux-mobile/focused-'+name+'-390.png'})
 }
 await visit(page,'/finance/governance/?lang=fr')
 await expect(page.getByRole('button',{name:'Essayer « Pour »',exact:true})).toHaveCount(0)
 await page.locator('.xa-task-tabs').getByRole('button',{name:'Règles',exact:true}).click()
 const practice=page.locator('.xa-dao-practice')
 await expect(practice).not.toHaveAttribute('open','')
 await practice.locator(':scope > summary').press('Enter')
 await expect(page.getByRole('button',{name:'Essayer « Pour »',exact:true}).first()).toBeVisible()
})

for(const width of [390,1440]){
 test('network switch separates Solana and MultiversX wallets at '+width+'px',async({page})=>{
  await page.setViewportSize({width,height:900})
  let solanaReads=0,mutations=0
  page.on('request',request=>{
   if(request.url().includes('api.mainnet-beta.solana.com'))solanaReads++
   if(request.method()==='POST'&&/\/transactions(?:\?|$)|\/v1\/xorus\/(execute|orders|sign)/.test(request.url()))mutations++
  })
  await visit(page,'/wallet/?lang=fr&network=multiversx')
  const chooser=page.getByRole('group',{name:'Réseau',exact:true})
  await expect(chooser.getByRole('button',{name:'MultiversX',exact:true})).toHaveAttribute('aria-pressed','true')
  await expect(chooser.locator('img[src$="/brands/multiversx.svg"]')).toBeVisible()
  await chooser.getByRole('button',{name:'Solana',exact:true}).click()
  await expect(page.locator('.xa-solana-wallet')).toBeVisible()
  await expect(page).toHaveURL(/network=solana/)
  await expect(page.locator('.xa-cockpit-metrics strong')).toHaveText(['—','—','—'])
  await expect(page.getByRole('link',{name:'Phantom',exact:true})).toBeVisible()
  await expect(page.locator('.xa-solana-wallet')).not.toContainText('erd1')
  expect(solanaReads).toBe(0);expect(mutations).toBe(0)
  await page.screenshot({animations:'disabled',path:'artifacts/ux-mobile/solana-wallet-'+width+'.png'})
  await chooser.getByRole('button',{name:'MultiversX',exact:true}).click()
  await expect(page.locator('.xa-solana-wallet')).toHaveCount(0)
  await expect(page.getByRole('button',{name:'Connecter un wallet',exact:true})).toBeVisible()
  expect(mutations).toBe(0)
 })
}

test('Wallet Standard consent reads only Solana assets and revocation clears every balance',async({page})=>{
 const address='11111111111111111111111111111111',mint='2xqre66jAqcSZFh1seMkgvQNVgG6uL1gwBtKVWuwePYC'
 await page.addInitScript(({address})=>{
  const state=window as any
  state.__solanaConnects=0;state.__solanaSigns=0
  let accounts:any[]=[{address,publicKey:new Uint8Array(32),chains:['solana:mainnet'],features:['solana:signTransaction','solana:signMessage']}]
  const listeners=new Set<(event:any)=>void>()
  let unregister:(()=>void)|undefined
  const wallet={version:'1.0.0',name:'Wallet test local',icon:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/B9sAAAAASUVORK5CYII=',chains:['solana:mainnet'],get accounts(){return accounts},features:{
   'standard:connect':{version:'1.0.0',connect:async()=>{state.__solanaConnects++;return {accounts}}},
   'standard:events':{version:'1.0.0',on:(_event:string,listener:(event:any)=>void)=>{listeners.add(listener);return()=>listeners.delete(listener)}},
   'standard:disconnect':{version:'1.0.0',disconnect:async()=>{accounts=[];for(const cb of listeners)cb({accounts})}},
   'solana:signTransaction':{version:'1.0.0',supportedTransactionVersions:['legacy',0],signTransaction:async()=>{state.__solanaSigns++;throw Error('signing forbidden in this test')}},
   'solana:signMessage':{version:'1.0.0',signMessage:async()=>{state.__solanaSigns++;throw Error('signing forbidden in this test')}},
  }}
  const register=(api:any)=>{unregister=api.register(wallet)}
  window.addEventListener('wallet-standard:app-ready',(event:any)=>register(event.detail))
  window.dispatchEvent(new CustomEvent('wallet-standard:register-wallet',{detail:register}))
  state.__solanaRevoke=()=>{accounts=[];for(const cb of listeners)cb({accounts})}
  state.__solanaUnregister=()=>unregister?.()
 },{address})
 const methods:string[]=[]
 await page.route('https://api.mainnet-beta.solana.com/**',async route=>{
  const r=route.request().postDataJSON();methods.push(r.method)
  const result=r.method==='getBalance'?{value:1234567890}
   :r.method==='getTokenAccountsByOwner'?{value:[{account:{owner:'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',data:{parsed:{info:{owner:address,mint,tokenAmount:{amount:'1',decimals:0}}}}}}]}
   :r.method==='getMultipleAccounts'?{value:[{owner:'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',data:{parsed:{type:'mint',info:{isInitialized:true,supply:'1',decimals:0}}}}]}
   :null
  expect(result,'only read-only RPC methods are allowed').not.toBeNull()
  await route.fulfill({json:{jsonrpc:'2.0',id:r.id,result}})
 })
 await page.setViewportSize({width:390,height:900})
 await visit(page,'/wallet/?lang=fr&network=solana')
 await expect(page.getByRole('button',{name:'Wallet test local',exact:true})).toBeVisible()
 expect(await page.evaluate(()=>(window as any).__solanaConnects)).toBe(0)
 await page.getByRole('button',{name:'Wallet test local',exact:true}).click()
 await expect(page.locator('.xa-cockpit-metrics strong').first()).toHaveText('1.23456789')
 await expect(page.locator('.xa-wallet-address')).toHaveText(address)
 await page.locator('.xa-wallet-views').getByRole('button',{name:'NFT',exact:true}).click()
 await expect(page.locator('.xa-solana-asset')).toHaveCount(1)
 expect(methods.sort()).toEqual(['getBalance','getMultipleAccounts','getTokenAccountsByOwner'].sort())
 expect(await page.evaluate(()=>(window as any).__solanaSigns)).toBe(0)
 await page.evaluate(()=>(window as any).__solanaRevoke())
 await expect(page.locator('.xa-cockpit-metrics strong')).toHaveText(['—','—','—'])
 await expect(page.locator('.xa-wallet-address')).toHaveCount(0)
 await expect(page.locator('.xa-solana-asset')).toHaveCount(0)
 expect(await page.evaluate(()=>(window as any).__solanaSigns)).toBe(0)
})

test('Solana marketplace and governance show their own network with no live purchase or official vote',async({page})=>{
 await page.setViewportSize({width:390,height:900})
 await visit(page,'/marketplace/?network=solana&lang=fr')
 await expect(page.locator('.xa-solana-market')).toBeVisible()
 await expect(page.getByRole('group',{name:'Réseau'}).getByRole('button',{name:'Solana',exact:true})).toHaveAttribute('aria-pressed','true')
 await expect(page.locator('.xa-task-status')).toContainText('Ventes xArtists non ouvertes')
 await expect(page.getByRole('button',{name:/acheter|buy|mint/i})).toHaveCount(0)
 await expect(page.locator('.xa-task-page')).not.toContainText('Polygon')
 await page.screenshot({animations:'disabled',path:'artifacts/ux-mobile/solana-market-390.png'})
 await visit(page,'/dao/?network=solana&lang=fr')
 await expect(page.getByRole('group',{name:'Réseau'}).getByRole('button',{name:'Solana',exact:true})).toHaveAttribute('aria-pressed','true')
 await expect(page.locator('.xa-task-status')).toContainText('Vote officiel non ouvert')
 await expect(page.getByRole('button',{name:/essayer|voter|vote for/i})).toHaveCount(0)
 await page.screenshot({animations:'disabled',path:'artifacts/ux-mobile/solana-dao-390.png'})
})

for (const width of [390,1440]) {
 for (const theme of ['light','dark'] as const) {
  test(`art-first home preserves readable violet hero at ${width}px in ${theme} mode`,async({page})=>{
   await page.addInitScript(theme=>localStorage.setItem('xa-theme',theme),theme)
   await page.setViewportSize({width,height:900})
   await page.emulateMedia({reducedMotion:'reduce'})
   await visit(page,'/?lang=fr')
   await expect(page.locator('html')).toHaveAttribute('data-theme',theme)
   const hero=page.locator('.xa-home-editorial')
   await expect(hero).toBeVisible()
   await expect(hero.locator('h1')).toHaveCSS('color','rgb(255, 255, 255)')
   await expect(hero).toHaveCSS('background-image',/radial-gradient/)
   await expect(hero.locator('.xa-home-artwork[href^="https://explorer.multiversx.com/nfts/"]')).toHaveCount(2)
   await expect(hero.locator('.xa-home-editorial-art')).toBeVisible()
   await expect(hero.locator('.xa-first-actions a')).toHaveCount(2)
   await expect(hero.locator('.xa-home-personal')).toBeVisible()
   await expect(hero.locator('canvas')).toHaveCount(0)
   await expect(page.locator('.xa-first-tile')).toHaveCount(4)
   expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(12)
   await page.screenshot({animations:'disabled',path:`artifacts/ux-mobile/editorial-home-${theme}-${width}.png`})
  })
 }
}
