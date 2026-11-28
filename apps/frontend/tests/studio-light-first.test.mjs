import assert from 'node:assert/strict'
import {test} from 'node:test'
import {readFileSync} from 'node:fs'

const source=readFileSync(new URL('../src/pages/StudioPage.tsx',import.meta.url),'utf8')
const css=readFileSync(new URL('../src/styles/creator-studio-light.css',import.meta.url),'utf8')
const modules=readFileSync(new URL('../src/experience/modules.ts',import.meta.url),'utf8')
const media=readFileSync(new URL('../src/components/CreatorMediaUpload.tsx',import.meta.url),'utf8')

test('artist Studio has legible light-first scoped workspace with dark-mode fallback',()=>{
  assert.match(modules,/import '\.\.\/styles\/creator-studio-light\.css'/)
  assert.doesNotMatch(source,/import '\.\.\/styles\/creator-studio-light\.css'/)
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
  assert.match(media,/L’envoi de fichiers est momentanément indisponible/)
})

test('ambiguous Pinata metadata publication cannot silently re-arm upload',()=>{
  assert.match(media,/metadata_pin_result_unknown_reconcile/)
  assert.match(media,/setNeedsReconciliation\(true\)/)
  assert.match(media,/pending\|\|needsReconciliation/)
  assert.match(media,/Publication suspendue pour ce fichier/)
})

test('standard hosting belongs to the target creation price, not a separate user task',()=>{
  assert.match(source,/Tarif cible : 0,90 € HT par NFT/)
  assert.match(source,/Hébergement standard, publication et métadonnées inclus/)
  assert.match(source,/Aucun paiement à cette étape/)
  assert.match(source,/durée de conservation/)
  assert.doesNotMatch(source,/Frais réseau et stockage en supplément/)
  assert.match(source,/Vous n’avez rien à héberger vous-même/)
  assert.match(source,/création Solana non disponible à ce stade/)
})
