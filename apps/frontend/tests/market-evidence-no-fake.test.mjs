import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {parseFreshMarketAssets,parseFreshFearGreed,parseFundingRate} from '../src/lib/marketEvidence.mjs'

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8')
const loader=read('../src/lib/marketData.ts')
const page=read('../src/pages/MarketPage.tsx')
const now=Date.parse('2026-11-13T04:00:00Z')
const asset={
  id:'bitcoin',symbol:'btc',name:'Bitcoin',current_price:65000,
  price_change_percentage_24h:1.7,market_cap:123000000,total_volume:120000,
  last_updated:'2026-11-13T03:59:00Z'
}

test('market price requires a timestamp from the external producer, not a browser fetch time',()=>{
  const rows=parseFreshMarketAssets([asset],now)
  assert.equal(rows.length,1)
  assert.equal(rows[0].sourceUpdatedAt,asset.last_updated)
  assert.equal(rows[0].symbol,'BTC')
  for(const bad of [
    {...asset,last_updated:undefined},
    {...asset,last_updated:'2026-11-13T03:30:00Z'},
    {...asset,last_updated:'2026-11-13T04:05:00Z'},
    {...asset,last_updated:'2026-11-31T03:59:00Z'},
    {...asset,current_price:'65000'},
    {...asset,current_price:NaN},
    {...asset,price_change_percentage_24h:Infinity},
    {...asset,price_change_percentage_24h:null},
    {...asset,current_price:0},
  ]){
    assert.deepEqual(parseFreshMarketAssets([bad],now),[])
  }
})

test('sentiment needs valid 0..100 and independently published daily timestamp',()=>{
  const ts=String(Math.floor(Date.parse('2026-11-13T00:00:00Z')/1000))
  assert.deepEqual(parseFreshFearGreed({data:[{value:'44',timestamp:ts,value_classification:'Fear'}]},now),
    {value:44,classification:'Fear',timestamp:'2026-11-13T00:00:00.000Z'})
  assert.equal(parseFreshFearGreed({data:[{value:'50'}]},now),null)
  assert.equal(parseFreshFearGreed({data:[{value:'1000',timestamp:ts}]},now),null)
  assert.equal(parseFreshFearGreed({data:[{value:'NaN',timestamp:ts}]},now),null)
  assert.equal(parseFreshFearGreed({data:[{value:'50',timestamp:'5'}]},now),null)
})

test('perpetual funding only accepts explicit bounded provider values',()=>{
  assert.equal(parseFundingRate('0.0001'),0.01)
  for(const invalid of [null,undefined,0,NaN,'NaN','Infinity','1e4','1','-1','']){
    assert.equal(parseFundingRate(invalid),null)
  }
})

test('public market cannot silently use demo prices, guessed correlation or synthetic funding',()=>{
  assert.doesNotMatch(loader,/loadFallback\(|data\/market_snapshot\.json|0\.72, 0\.55|rate: 0\.01, source: 'fallback'/)
  assert.match(loader,/if \(!fng \|\| assets\.length === 0\)/)
  assert.match(loader,/throw new Error\('Sources de marché horodatées indisponibles/)
  assert.match(loader,/parseFreshMarketAssets\(data\)/)
  assert.match(loader,/return \{ symbols: \[\], matrix: \[\] \}/)
  assert.match(loader,/Funding perp : indisponible/)
  assert.match(loader,/Aucune allocation automatique ni décision xOrus/)
  assert.match(page,/Aucune valeur de démonstration ne remplace une panne API/)
  assert.match(page,/Data provided by CoinGecko/)
})
