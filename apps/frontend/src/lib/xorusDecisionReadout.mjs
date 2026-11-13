/**
 * xOrus decision-readout: deterministic, read-only projection of the published
 * historical paper board. This is NOT a scoring engine or a trading signal.
 * Never upgrade this output to a verified/realtime trade recommendation.
 */
const MAX_TTL_MS=15*60*1000
const CLOCK_SKEW_MS=60*1000
const SAFE_REASONS=new Set([
  'thin_tape','risk_veto','sentinel_veto','low_agreement',
  'unverified_tape','invalid_market','operator_halt','crosscut',
])
const UTC=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/
function utcTime(s){
  if(typeof s!=='string'||!UTC.test(s))return null
  const ms=Date.parse(s)
  if(!Number.isFinite(ms)||new Date(ms).toISOString().slice(0,19)!==s.slice(0,19))return null
  return ms
}
function count(value,max){
  return Number.isSafeInteger(value)&&value>=0&&value<=max?value:null
}
function unavailable(reason){
  return Object.freeze({
    state:'unavailable',reason,stance:'ABSTAIN',reportedStance:null,
    signalsDefined:120,signalsReported:null,familiesReported:null,
    independentlyVerifiedSignals:0,independentlyVerifiedFamilies:0,
    sourceTs:null,ageMinutes:null,live:false,executable:false,
    isStale:true,sourceMode:'static_paper_snapshot',
  })
}
export function interpretXorusSnapshot(snapshot,nowMs=Date.now()){
  if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot))
    return unavailable('missing_snapshot')
  const cut=snapshot.crosscut
  if(snapshot.engine!=='xorus'||snapshot.snapshot_kind!=='static_paper_snapshot'
    ||snapshot.live_locked!==true||snapshot.live_trading!==false
    ||!cut||typeof cut!=='object'||Array.isArray(cut)
    ||cut.executable!==false||cut.live_trading!==false)
    return unavailable('invalid_safety_contract')
  const defined=count(cut.signals_defined,120)
  const fed=count(cut.signals_fed,120)
  const families=count(cut.families_fed,12)
  if(defined!==120||fed===null||families===null||fed>defined)
    return unavailable('invalid_signal_counts')
  const ts=utcTime(snapshot.ts)
  if(ts===null||!Number.isFinite(nowMs)||ts>nowMs+CLOCK_SKEW_MS)
    return unavailable('invalid_source_timestamp')
  const age=Math.max(0,Math.floor((nowMs-ts)/60000))
  const stale=nowMs-ts>=MAX_TTL_MS
  // The published board does not carry independently signed, source-level
  // proofs. Even a positive internal/legacy stance is not recommendation.
  const eligible=(fed>=12&&families>=3)
  const stance=cut.stance==='ABSTAIN'?'ABSTAIN':'ABSTAIN'
  const reason=stale?'stale_snapshot':
    !eligible?'thin_tape':
    (typeof cut.reason==='string'&&SAFE_REASONS.has(cut.reason)?cut.reason:'unverified_tape')
  return Object.freeze({
    state:stale?'stale':'paper',
    reason,stance,reportedStance:typeof cut.stance==='string'?cut.stance:null,
    signalsDefined:defined,signalsReported:fed,familiesReported:families,
    independentlyVerifiedSignals:0,independentlyVerifiedFamilies:0,
    sourceTs:snapshot.ts,ageMinutes:age,live:false,executable:false,
    isStale:stale,sourceMode:'static_paper_snapshot',
  })
}
/** Economic observations are public context, never source-level validated
 * execution inputs. The provider does not timestamp every metric. */
export function parseMultiversxEconomics(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return null
  const price=raw.price
  const cap=raw.marketCap
  const volume=raw.volume24h
  const good=v=>typeof v==='number'&&Number.isFinite(v)&&v>0
  if(!good(price))return null
  return Object.freeze({
    priceUsd:price,
    marketCapUsd:good(cap)?cap:null,
    volume24hUsd:good(volume)?volume:null,
    provenance:'multiversx_public_api',
    sourceTimestampVerified:false,
    decisionEligible:false,
  })
}
