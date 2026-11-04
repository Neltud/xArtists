import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { Window } from 'happy-dom'
import { createSimpleIntentService } from '../../../services/access-api/src/liaSimple.mjs'
import { buildPackQuote } from '../../../services/access-api/src/quote.mjs'

const require = createRequire(import.meta.url)
const wallet = 'erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6'

async function loadCheckout(harness) {
  const mocks = {
    '../i18n/phraseRuntime': 'export const renderChild = x => x; export const localizeChild = x => x',
    'react-router-dom': 'export const Link = props => props.children',
    '../config/agentPacks': 'export const AGENT_PACKS = ' + JSON.stringify(
      ['pulse', 'yield', 'sentinel'].map((id, i) => ({
        id, name: id, icon: '', priceEgld: { list: [10, 5, 2.5][i] },
        priceEur: { list: [110, 75, 50][i] },
      }))),
    '../context/WalletContext': 'export const useWallet = () => __packHarness.wallet',
    './CheckoutModal': 'export default function Modal(props) { __packHarness.modalRenders++; if (props.open) __packHarness.modalOpens++; return null }',
    '../config/scStatus': 'export const canBuyAgent = () => false',
    './LottieIcon': 'export default function Icon() { return null }',
    '../lib/payments': 'export const availablePayMethods = () => []',
    '../lib/stripe': 'export const getAccessApiBase = () => "https://api.invalid"',
    '../lib/walletEvents': 'export const requestOpenConnect = () => { __packHarness.connectRequests++ }',
    '../i18n/I18nContext': 'export const useI18n = () => ({t: key => key})',
    '../lib/accessSession': 'export const getAccessToken = () => "paper-test-session"',
    '../lib/liaSimple': [
      'export const ensureSimplePaperToken = async () => "paper-test-session";',
      'export const prepareSimplePack = (...args) => __packHarness.prepare(...args);',
      'export const confirmSimplePack = (...args) => __packHarness.confirm(...args);',
      'export const cancelSimplePack = (...args) => __packHarness.cancel(...args);',
    ].join('\n'),
  }
  const result = await build({
    entryPoints: [fileURLToPath(new URL('../src/components/PackCheckout.tsx', import.meta.url))],
    bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
    external: ['react', 'react/jsx-runtime'],
    define: { 'import.meta.env': JSON.stringify({ VITE_GENESIS_COMMERCIAL_GO: '0' }) },
    plugins: [{
      name: 'trusted-test-ports',
      setup(builder) {
        builder.onResolve({ filter: /.*/ }, args => Object.hasOwn(mocks, args.path)
          ? { path: args.path, namespace: 'paper-test-port' } : undefined)
        builder.onLoad({ filter: /.*/, namespace: 'paper-test-port' },
          args => ({ contents: mocks[args.path], loader: 'js' }))
      },
    }],
    logLevel: 'silent',
  })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', '__packHarness', result.outputFiles[0].text)(
    require, module, module.exports, harness)
  return module.exports.default
}

function button(container, text) {
  const result = [...container.querySelectorAll('button')].find(b => b.textContent.trim() === text)
  assert.ok(result, 'missing button: ' + text)
  return result
}

test('real PackCheckout PAPER click prepares/confirms without mounting checkout or creating access', async () => {
  const window = new Window({ url: 'https://neltud.github.io/xArtists/' })
  const globals = {
    window, document: window.document, navigator: window.navigator,
    HTMLElement: window.HTMLElement, Node: window.Node,
    localStorage: window.localStorage, sessionStorage: window.sessionStorage,
    IS_REACT_ACT_ENVIRONMENT: true,
  }
  const saved = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  const originalFetch = globalThis.fetch
  let requests = 0
  let root
  try {
    for (const [key, value] of Object.entries(globals)) {
      Object.defineProperty(globalThis, key, { value, writable: true, configurable: true })
    }
    globalThis.fetch = async () => { requests++; throw new Error('unexpected_real_network_request') }
    const React = require('react')
    const { act } = React
    const { createRoot } = require('react-dom/client')
    const events = []
    const calls = []
    const receipts = []
    let previewDone = 0
    const service = createSimpleIntentService({
      guardian: () => ({ mode: 'paper', paused: false }),
      quoteProvider: ({ packTier, nowMs }) => buildPackQuote({
        pack_id: packTier, rate_eur_per_egld: 10, now: nowMs,
      }),
      log: event => events.push(event),
    })
    const harness = {
      wallet: { connected: true, address: wallet, canAttemptSign: false },
      modalRenders: 0, modalOpens: 0, connectRequests: 0,
      prepare: async intent => { calls.push('prepare'); return service.prepare(intent, { userAddress: wallet }) },
      confirm: async id => {
        calls.push('confirm')
        const receipt = service.confirm(id, { userAddress: wallet })
        receipts.push(receipt)
        return receipt
      },
      cancel: async id => service.cancel(id, { userAddress: wallet }),
    }
    const PackCheckout = await loadCheckout(harness)
    const container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    await act(async () => {
      root.render(React.createElement(PackCheckout, { packId: 'pulse', onPaperDone: () => previewDone++ }))
    })
    assert.equal(button(container, 'Achat suspendu').disabled, true)
    await act(async () => button(container, 'Achat suspendu').click())
    assert.deepEqual(calls, [])
    await act(async () => button(container, 'Préparer une simulation · PAPER').click())
    assert.deepEqual(calls, ['prepare'])
    assert.ok(container.querySelector('[aria-label="Confirmer la simulation LIA"]'))
    assert.equal(harness.modalRenders, 0)
    await act(async () => button(container, 'Confirmer la simulation').click())
    assert.deepEqual(calls, ['prepare', 'confirm'])
    assert.match(container.textContent, /Simulation enregistrée \(PAPER\)/)
    assert.equal(receipts.length, 1)
    for (const key of ['paymentVerified', 'deliveryVerified', 'nftMinted', 'accessGranted']) {
      assert.equal(receipts[0][key], false)
    }
    assert.equal(receipts[0].txHash, null)
    assert.equal(receipts[0].amountChargedCents, 0)
    assert.equal(events.length, 1)
    assert.equal(harness.modalRenders, 0)
    assert.equal(harness.modalOpens, 0)
    assert.equal(previewDone, 0, 'PAPER must not create device-preview access')
    assert.equal(harness.connectRequests, 0)
    assert.equal(window.localStorage.length, 0)
    assert.equal(window.sessionStorage.length, 0)
    assert.equal(requests, 0, 'no PSP, wallet or chain request')
  } finally {
    if (root) {
      const { act } = require('react')
      await act(async () => root.unmount())
    }
    globalThis.fetch = originalFetch
    await window.happyDOM.close()
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete globalThis[key]
    }
  }
})

