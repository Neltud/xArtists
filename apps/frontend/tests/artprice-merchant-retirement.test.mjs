import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const panel = read('../src/components/market/ArtpriceOfficialPanel.tsx')
const market = read('../src/pages/MarketplacePage.tsx')
const rwa = read('../src/components/PhysicalWorkFlowPanel.tsx')
const tro = read('../src/pages/TroCrosschainPage.tsx')
const readme = read('../../../README.md')

test('live art market screens no longer advertise external Etsy/Shopify merchants or sales', () => {
  for (const [path,c] of [
    ['Marketplace',market],['PhysicalWork',rwa],['TRO',tro],['README',readme],
  ]) {
    assert.doesNotMatch(c, /(?:Shopify|Etsy|myshopify|etsy\.com)/i, path)
  }
  assert.match(market, /ArtpriceOfficialPanel/)
  assert.match(market, /Aucune vente directe active/)
  assert.match(rwa, /Registre logistique actuellement indisponible/)
  assert.doesNotMatch(rwa, /fetch\(|POST|signAccessMessage|startPackPayment|createCheckoutSession/)
})

test('Artprice panel displays official publisher and official report only; no paid rows or fake price', () => {
  assert.match(panel, /fr\.artprice\.com\/artprice-news\/13751\//)
  assert.match(panel, /fr\.artprice\.com\/'/)
  assert.match(panel, /licence officielle en attente/)
  assert.match(panel, /Aucune cote ou estimation publiée/)
  assert.match(panel, /noopener noreferrer/)
  assert.match(panel, /getAccessApiBase/)
  assert.match(panel, /\/v1\/artprice\/status/)
  assert.doesNotMatch(panel, /\/v1\/artprice\/records/)
  assert.doesNotMatch(panel, /(?:axios|cheerio|scrape|crawl|iframe|dangerouslySetInnerHTML)/)
  assert.doesNotMatch(panel, /data:\s*\[\{.*(?:estimate|hammer_price|sale_price)/s)
})

test('Artprice and retired vendor messaging is readable in both light and dark and mobile', () => {
  for (const c of [panel,rwa]) {
    assert.match(c, /bg-white/)
    assert.match(c, /dark:bg-zinc-900/)
    assert.match(c, /dark:text-zinc-100/)
    assert.match(c, /min-h-\[44px\]/)
    assert.match(c, /text-sm leading-7/)
  }
  assert.match(panel, /role="status"/)
  assert.match(rwa, /role="status"/)
})
