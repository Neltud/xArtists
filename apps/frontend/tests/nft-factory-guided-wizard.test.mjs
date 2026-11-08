import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL('../src/'+path, import.meta.url), 'utf8')

test('factory defaults to three guided stages without a wallet', () => {
  const ui = read('pages/NftDistributorPage.tsx')
  assert.match(ui, /useState<'create' \| 'verify' \| 'publish'>\('create'\)/)
  assert.match(ui, /aria-label="Étapes de création NFT"/)
  assert.match(ui, /aria-current=\{factoryStep === step.id \? 'step' : undefined\}/)
  for (const stage of ['create','verify','publish'])
    assert.match(ui, new RegExp("factoryStep === '"+stage+"' && <section"))
  assert.match(ui, /Continuer : vérifier mon œuvre/)
  assert.match(ui, /Voir ce qu’il manque pour publier/)
  assert.match(ui, /Publication non disponible ici/)
  assert.match(ui, /Déclaration des droits/)
  assert.match(ui, /Poursuivre dans Creator Studio/)
})

test('complex options are hidden in opt-in disclosures by default', () => {
  const ui = read('pages/NftDistributorPage.tsx')
  const evidence = read('components/CreatorEvidenceHandoff.tsx')
  const css = read('experience/nft-factory-wizard.css')
  assert.match(ui, /<details className="xa-factory-advanced/)
  assert.match(ui, /Réglages avancés \(agents, paramètres, devis simulé\)/)
  assert.match(ui, /Personnaliser une fiche NFT \(avancé\)/)
  assert.match(ui, /Options avancées : distributeur et simulation/)
  assert.match(evidence, /Voir les détails techniques et exporter les dossiers/)
  assert.match(evidence, /Bande-annonce : autorisation de promotion \(facultatif\)/)
  assert.match(evidence, /Vérifier mon fichier/)
  assert.match(css, /var\(--xa-panel\)/)
  assert.match(css, /min-height: 44px/)
  assert.match(css, /prefers-reduced-motion: reduce/)
})

test('wizard retains explicit no-commerce/no-mint guards', () => {
  const ui = read('pages/NftDistributorPage.tsx')
  const evidence = read('components/CreatorEvidenceHandoff.tsx')
  const status = read('config/scStatus.ts')
  assert.match(ui, /CreatorEvidenceHandoff art=\{art\}/)
  assert.match(ui, /disabled className="btn-primary/)
  assert.match(ui, /simulatePaperDraw/)
  assert.doesNotMatch(ui, /\bsendTransaction\s*\(|\bfetch\s*\(/)
  assert.doesNotMatch(evidence, /\bsendTransaction\s*\(|\bfetch\s*\(/)
  assert.match(status, /AGENT_PACK_PUBLIC_MINT_RELEASED = false/)
  assert.match(status, /AGENT_PACK_PUBLIC_COMMERCE_RELEASED = false/)
})
