import { pilotCeilings } from './pilotCeilings.mjs'

const DAY = 86_400_000
const MAX_EVENTS = 500
const MAX_PROPOSALS = 200
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const NETWORKS = ['multiversx', 'solana']
const SAFETY = Object.freeze({ mode: 'paper_simulation', virtual_capital: true,
  execution_authorized: false, signing_authorized: false, live_budget_cents: 0,
  funds_moved: false, model_inference_configured: false, provider_quote_verified: false })
const integer = (v, max = 1_000_000) => Number.isSafeInteger(v) && v >= 0 && v <= max
const stable = value => JSON.stringify(Object.fromEntries(Object.keys(value).sort().map(k => [k, value[k]])))
class PaperError extends Error {}
const requireValue = (value, reason) => { if (!value) throw new PaperError(reason) }

export function createPaperState({ capitalCents = 10_000, now = Date.now() } = {}) {
  const limits = pilotCeilings(capitalCents)
  return { schema_version: 1, ...SAFETY, limits, created_at_ms: now, last_action_at_ms: 0,
    revision: 0, proposals: [], events: [], halts: { pilot: false,
      daily_until_ms: 0, networks: Object.fromEntries(NETWORKS.map(n => [n, { pilot: false, daily_until_ms: 0 }])) } }
}

function assertState(state) {
  requireValue(state?.schema_version === 1 && state.mode === SAFETY.mode &&
    state.execution_authorized === false && state.live_budget_cents === 0 &&
    Array.isArray(state.events) && state.events.length <= MAX_EVENTS &&
    Array.isArray(state.proposals) && state.proposals.length <= MAX_PROPOSALS &&
    state.revision === state.events.length && integer(state.last_action_at_ms, Number.MAX_SAFE_INTEGER), 'invalid_paper_state')
  const expected = pilotCeilings(state.limits?.reference_capital_cents)
  requireValue(state.limits.global?.loss_stop_pilot_cents === expected.global.loss_stop_pilot_cents &&
    state.limits.global?.loss_stop_rolling_24h_cents === expected.global.loss_stop_rolling_24h_cents &&
    NETWORKS.every(n => stable(state.limits.networks?.[n] || {}) === stable(expected.networks[n])), 'invalid_paper_limits')
}

function assetFormat(network, token) {
  if (typeof token !== 'string') return false
  if (network === 'multiversx') return token === 'EGLD' || /^[A-Z0-9]{3,10}-[a-f0-9]{6}$/.test(token)
  if (token === 'native') return true
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(token)) return false
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let n = 0n
  for (const char of token) n = n * 58n + BigInt(alphabet.indexOf(char))
  const leading = token.match(/^1*/)[0].length
  return leading + (n === 0n ? 0 : Math.ceil(n.toString(16).length / 2)) === 32
}

function metrics(state, now) {
  const blank = () => ({ loss_24h_cents: 0, loss_pilot_cents: 0, open_notional_cents: 0, open_positions: 0 })
  const networks = Object.fromEntries(NETWORKS.map(n => [n, blank()]))
  let pnl = 0
  for (const event of state.events) {
    const loss = event.realized_price_loss_cents + event.fee_cents
    networks[event.network].loss_pilot_cents += loss
    if (event.at_ms > now - DAY) networks[event.network].loss_24h_cents += loss
  }
  for (const p of state.proposals) {
    if (p.status === 'open_simulation') {
      const unrealized = Math.max(0, p.notional_cents - p.mark_value_cents)
      const n = networks[p.network]
      n.open_positions++
      n.open_notional_cents += p.notional_cents
      n.loss_pilot_cents += unrealized
      // Current open losses remain risk even when the entry is older than 24 hours.
      n.loss_24h_cents += unrealized
      pnl += p.mark_value_cents - p.notional_cents - p.entry_fee_cents
    } else pnl += p.paper_net_pnl_cents
  }
  const global = blank()
  for (const value of Object.values(networks)) for (const key of Object.keys(global)) global[key] += value[key]
  return { networks, global, paper_net_pnl_cents: pnl }
}

function latchStops(state, now) {
  const risk = metrics(state, now)
  for (const network of NETWORKS) {
    const n = risk.networks[network], limit = state.limits.networks[network], halt = state.halts.networks[network]
    if (limit.loss_stop_pilot_cents > 0 && n.loss_pilot_cents >= limit.loss_stop_pilot_cents) halt.pilot = true
    if (limit.loss_stop_rolling_24h_cents > 0 && n.loss_24h_cents >= limit.loss_stop_rolling_24h_cents)
      halt.daily_until_ms = Math.max(halt.daily_until_ms, now + DAY)
  }
  if (state.limits.global.loss_stop_pilot_cents > 0 && risk.global.loss_pilot_cents >= state.limits.global.loss_stop_pilot_cents) state.halts.pilot = true
  if (state.limits.global.loss_stop_rolling_24h_cents > 0 && risk.global.loss_24h_cents >= state.limits.global.loss_stop_rolling_24h_cents)
    state.halts.daily_until_ms = Math.max(state.halts.daily_until_ms, now + DAY)
}

export function paperLedgerView(state, now = Date.now()) {
  assertState(state)
  return { ...SAFETY, schema_version: 1, revision: state.revision,
    reference_capital_cents: state.limits.reference_capital_cents, reserve_cents: state.limits.reserve_cents,
    limits: structuredClone(state.limits), risk: metrics(state, now), halts: structuredClone(state.halts),
    proposals: structuredClone(state.proposals),
    events: state.events.slice(-25).map(({ fingerprint, ...event }) => ({ ...event })),
    total_events: state.events.length, storage_limits: { events: MAX_EVENTS, proposals: MAX_PROPOSALS },
    price_source: 'manual_hypothetical_reference', token_existence_verified: false,
    transaction_payload: null, stop_is_guaranteed_maximum_loss: false }
}

/** No RPC, signer, wallet, quote provider or external tool can be reached from this engine. */
export function applyPaperCommand(current, command, now = Date.now()) {
  try {
    assertState(current)
    requireValue(command && typeof command === 'object' && !Array.isArray(command), 'invalid_paper_command')
    const fields = command.type === 'propose'
      ? ['type', 'idempotency_key', 'network', 'token_in', 'token_out', 'notional_cents', 'fee_cents', 'slippage_bps', 'reference_at_ms']
      : command.type === 'mark' ? ['type', 'idempotency_key', 'proposal_id', 'value_cents', 'reference_at_ms']
      : command.type === 'close' ? ['type', 'idempotency_key', 'proposal_id', 'value_cents', 'fee_cents', 'reference_at_ms'] : null
    requireValue(fields && fields.every(k => Object.hasOwn(command, k)) && Object.keys(command).every(k => fields.includes(k)), 'invalid_paper_fields')
    requireValue(typeof command.idempotency_key === 'string' && UUID.test(command.idempotency_key), 'invalid_idempotency_key')
    const fingerprint = stable(command)
    const prior = current.events.find(e => e.idempotency_key === command.idempotency_key)
    if (prior) {
      requireValue(prior.fingerprint === fingerprint, 'idempotency_conflict')
      return { ok: true, replayed: true, state: structuredClone(current), view: paperLedgerView(current, now) }
    }
    requireValue(integer(now, Number.MAX_SAFE_INTEGER) && now >= current.last_action_at_ms, 'invalid_or_reversed_clock')
    requireValue(integer(command.reference_at_ms, Number.MAX_SAFE_INTEGER) &&
      now - command.reference_at_ms >= -5000 && now - command.reference_at_ms <= 30_000, 'stale_or_invalid_paper_reference')
    const state = structuredClone(current)
    const open = state.proposals.filter(p => p.status === 'open_simulation')
    requireValue(state.events.length < MAX_EVENTS, 'paper_journal_full')
    let p, fee = 0, realizedLoss = 0
    if (command.type === 'propose') {
      const network = command.network
      requireValue(NETWORKS.includes(network), 'network_has_no_pilot_budget')
      requireValue(assetFormat(network, command.token_in) && assetFormat(network, command.token_out) && command.token_in !== command.token_out, 'exact_asset_identifier_required')
      const limit = state.limits.networks[network], risk = metrics(state, now), halt = state.halts.networks[network]
      requireValue(!state.halts.pilot && !halt.pilot, 'pilot_loss_stop')
      requireValue(now >= state.halts.daily_until_ms && now >= halt.daily_until_ms &&
        risk.global.loss_24h_cents < state.limits.global.loss_stop_rolling_24h_cents &&
        risk.networks[network].loss_24h_cents < limit.loss_stop_rolling_24h_cents, 'daily_loss_stop')
      requireValue(integer(command.notional_cents) && command.notional_cents > 0 && command.notional_cents <= limit.max_order_cents, 'order_cap_exceeded')
      requireValue(integer(command.fee_cents) && integer(command.slippage_bps, 50), 'invalid_fee_or_slippage')
      fee = command.fee_cents
      requireValue(risk.networks[network].loss_24h_cents + fee < limit.loss_stop_rolling_24h_cents &&
        risk.global.loss_24h_cents + fee < state.limits.global.loss_stop_rolling_24h_cents &&
        risk.networks[network].loss_pilot_cents + fee < limit.loss_stop_pilot_cents &&
        risk.global.loss_pilot_cents + fee < state.limits.global.loss_stop_pilot_cents, 'fees_exhaust_loss_allowance')
      requireValue(open.filter(p => p.network === network).length < limit.max_open_positions && open.length < state.limits.global.max_open_positions, 'position_limit')
      requireValue(risk.global.open_notional_cents + command.notional_cents <= state.limits.global.max_open_notional_cents &&
        risk.networks[network].open_notional_cents + command.notional_cents + fee + risk.networks[network].loss_pilot_cents <= limit.capital_ceiling_cents, 'capital_or_exposure_cap')
      requireValue(state.proposals.length < MAX_PROPOSALS && state.events.length + open.length + 2 <= MAX_EVENTS, 'paper_journal_full')
      p = { id: command.idempotency_key, network, token_in: command.token_in, token_out: command.token_out,
        notional_cents: command.notional_cents, entry_fee_cents: fee, mark_value_cents: command.notional_cents,
        slippage_bps: command.slippage_bps, status: 'open_simulation', opened_at_ms: now,
        valuation: 'manual_hypothetical_reference', executable: false }
      state.proposals.push(p)
    } else {
      requireValue(typeof command.proposal_id === 'string' && UUID.test(command.proposal_id), 'invalid_proposal_id')
      p = state.proposals.find(p => p.id === command.proposal_id)
      requireValue(p?.status === 'open_simulation', 'open_simulation_not_found')
      requireValue(integer(command.value_cents), 'invalid_paper_value')
      if (command.type === 'mark') {
        requireValue(state.events.length + open.length + 1 <= MAX_EVENTS, 'paper_journal_full')
        p.mark_value_cents = command.value_cents
      } else {
        requireValue(integer(command.fee_cents), 'invalid_paper_fee')
        fee = command.fee_cents
        const risk = metrics(state, now).networks[p.network]
        const available = Math.max(0, state.limits.networks[p.network].capital_ceiling_cents - risk.loss_pilot_cents - risk.open_notional_cents)
        requireValue(fee <= command.value_cents + available, 'insufficient_virtual_cash_for_fees')
        realizedLoss = Math.max(0, p.notional_cents - command.value_cents)
        p.status = 'closed_simulation'
        p.closed_at_ms = now
        p.exit_value_cents = command.value_cents
        p.exit_fee_cents = fee
        p.paper_net_pnl_cents = command.value_cents - p.notional_cents - p.entry_fee_cents - fee
      }
    }
    state.events.push({ idempotency_key: command.idempotency_key, fingerprint, type: command.type,
      proposal_id: p.id, network: p.network, at_ms: now, fee_cents: fee, realized_price_loss_cents: realizedLoss })
    state.revision++
    state.last_action_at_ms = now
    latchStops(state, now)
    return { ok: true, replayed: false, state, view: paperLedgerView(state, now) }
  } catch (error) {
    return { ok: false, error: error instanceof PaperError ? error.message : 'invalid_paper_state_or_command',
      ...SAFETY }
  }
}
