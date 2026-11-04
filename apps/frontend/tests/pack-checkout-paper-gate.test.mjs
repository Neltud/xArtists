import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

test('PackCheckout PAPER path never opens CheckoutModal and keeps commercial buy locked', async () => {
  const source = await fs.readFile(new URL('../src/components/PackCheckout.tsx', import.meta.url), 'utf8')

  // Commercial CTA remains locked unless independent GO + API runtime pass.
  assert.match(source, /disabled=\{!checkoutAvailable\}/)
  assert.match(source, /checkoutAvailable \? t\('packCheckout\.buy'\) : 'Achat suspendu'/)
  assert.match(source, /VITE_GENESIS_COMMERCIAL_GO === '1'/)

  // PAPER prepare button only when commercial checkout is closed.
  assert.match(source, /!checkoutAvailable && \(/)
  assert.match(source, /Préparer une simulation · PAPER/)
  assert.match(source, /onClick=\{\(\) => \{ void onPreparePaper\(pack\.id\) \}\}/)

  // PAPER handlers call liaSimple only — never setModalOpen(true).
  assert.match(source, /const onPreparePaper = async/)
  assert.match(source, /prepareSimplePack\(/)
  assert.match(source, /confirmSimplePack\(/)
  assert.match(source, /cancelSimplePack\(/)
  assert.doesNotMatch(source, /onPreparePaper[\s\S]{0,400}setModalOpen\(true\)/)
  assert.doesNotMatch(source, /onConfirmPaper[\s\S]{0,400}setModalOpen\(true\)/)

  // CheckoutModal mounts only when checkoutAvailable (commercial path).
  assert.match(source, /selected && checkoutAvailable && \(/)
  assert.match(source, /<CheckoutModal/)
  assert.match(source, /open=\{modalOpen\}/)

  // Receipt claims remain paper-only.
  assert.match(source, /Simulation enregistrée \(PAPER\)\. 0 € prélevé · aucun NFT minté · aucun accès accordé/)
  assert.match(source, /Aucun paiement, ordre, NFT, avantage ou accès ne sera créé/)
})

test('frontend liaSimple client rejects non-paper receipts', async () => {
  const source = await fs.readFile(new URL('../src/lib/liaSimple.ts', import.meta.url), 'utf8')
  assert.match(source, /response\.mode !== 'paper'/)
  assert.match(source, /response\.paperMode !== true/)
  assert.match(source, /response\.quote\?\.payable !== false/)
  assert.match(source, /response\.paymentVerified !== false/)
  assert.match(source, /response\.deliveryVerified !== false/)
  assert.match(source, /response\.nftMinted !== false/)
  assert.match(source, /response\.amountChargedCents !== 0/)
  assert.doesNotMatch(source, /CheckoutModal/)
  assert.doesNotMatch(source, /setModalOpen/)
})
