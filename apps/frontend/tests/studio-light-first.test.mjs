import assert from 'node:assert/strict'
import {test} from 'node:test'
import {readFileSync} from 'node:fs'

const source=readFileSync(new URL('../src/pages/StudioPage.tsx',import.meta.url),'utf8')
const css=readFileSync(new URL('../src/styles/creator-studio-light.css',import.meta.url),'utf8')
const media=readFileSync(new URL('../src/components/CreatorMediaUpload.tsx',import.meta.url),'utf8')

test('artist Studio has legible light-first scoped workspace with dark-mode fallback',()=>{
  assert.match(source,/import '\.\.\/styles\/creator-studio-light\.css'/)
  assert.match(source,/xa-creator-studio/)
  assert.equal((source.match(/card xa-studio-workflow/g)||[]).length,4)
  assert.match(css,/html\[data-theme="light"\] \.xa-studio-workflow/)
  assert.doesNotMatch(css,/html\[data-theme="dark"\] .*\!important/)
  assert.match(css,/input:not\(\[type="checkbox"\]\)/)
  assert.match(css,/prefers-reduced-motion/)
})
test('novice workflow distinguishes signed on-chain mint from IPFS upload',()=>{
  assert.match(source,/Étapes pour créer un NFT artiste/)
  assert.match(source,/Wallet/)
  assert.match(source,/Collection/)
  assert.match(source,/IPFS/)
  assert.match(source,/Signature/)
  assert.match(source,/Signer la création NFT/)
  assert.match(media,/Le NFT n'est PAS encore minté/)
  assert.match(media,/Upload IPFS indisponible/)
})
