/** Allowlisted customer analysis. Never exposes the internal decision board. */
const ROLES={
  scout:['onchain','dex'],tape:['price','volume','volatility','liquidity','funding'],
  crowd:['social'],curator:['art'],sentinel:['risk'],macro:['macro'],chair:['external'],scribe:[],
}
const READINGS=new Set(['no_input','context_only','positive','negative','mixed','balanced'])
const REASONS=new Set(['thin_tape','unverified_tape','sentinel_veto','invalid_market','chair_weight_violation'])
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)
const count=(v,max)=>Number.isSafeInteger(v)&&v>=0&&v<=max
const STATES=new Set(['observed','unavailable','unauthorized','rate_limited','invalid_payload','stale_source','insufficient_history'])
const timestamp=value=>{
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value))return null
  const time=Date.parse(value)
  return Number.isFinite(time)&&new Date(time).toISOString().slice(0,19)===value.slice(0,19)?time:null
}
const SCENARIOS=[
  ['verified_quorum_and_source_review','reassess_analysis'],
  ['sentinel_veto_or_operator_halt','maintain_abstention'],
]

export function interpretXorusAnalysisReport(raw,nowMs=Date.now()){
  if(!object(raw)||!['xorus_analysis/v1','xorus_analysis/v2'].includes(raw.schema)||raw.engine!=='xorus'
    ||raw.product!=='proprietary_analysis'||raw.method!=='deterministic_paper_synthesis/v1'
    ||raw.mode!=='paper_only'||raw.raw_data_included!==false
    ||raw.commercial_enabled!==false||raw.access_granted!==false
    ||raw.confidence!==null
    ||typeof raw.report_sha256!=='string'||! /^[a-f0-9]{64}$/.test(raw.report_sha256)
    ||!object(raw.decision)||raw.decision.stance!=='ABSTAIN'||!REASONS.has(raw.decision.reason)
    ||!object(raw.safety)||raw.safety.requires_human_review!==true)return null
  for(const key of ['executable','live_trading','signing_authorized','trade_authorized','mint_authorized','transfer_authorized']){
    if(raw.safety[key]!==false)return null
  }
  const coverage=raw.coverage
  if(!object(coverage)||coverage.signals_defined!==120
    ||!count(coverage.signals_analyzed,110)||!count(coverage.families_analyzed,11)
    ||coverage.independently_verified_signals!==0)return null
  const generated=timestamp(raw.generated_at)
  if(generated===null||!Number.isFinite(nowMs)||generated>nowMs+60000)return null
  let collection=null,source=null
  if(raw.schema==='xorus_analysis/v1'){
    if(raw.input_provenance!=='unverified_offline_inputs'||raw.source_ts!==null)return null
  }else{
    const c=raw.collection
    if(!object(c)||c.provider!=='binance_spot_public'||c.instrument!=='EGLDUSDT'||c.interval!=='1h'
      ||!STATES.has(c.state)||c.received_at!==raw.generated_at||c.source_max_age_seconds!==3900
      ||!Number.isSafeInteger(c.retry_after_seconds)||c.retry_after_seconds<60||c.retry_after_seconds>3600)return null
    if(c.state==='observed'){
      source=timestamp(raw.source_ts)
      if(raw.input_provenance!=='provider_observed_unverified'||source===null||source>generated
        ||generated-source>3901000||!Number.isSafeInteger(c.candles_used)||c.candles_used<25||c.candles_used>49
        ||typeof c.payload_sha256!=='string'||! /^[a-f0-9]{64}$/.test(c.payload_sha256)
        ||coverage.signals_analyzed<3||coverage.signals_analyzed>6)return null
    }else if(raw.input_provenance!=='no_usable_provider_input'||raw.source_ts!==null
      ||c.candles_used!==0||c.payload_sha256!==null||coverage.signals_analyzed!==0)return null
    collection={provider:'Binance Spot',instrument:'EGLD/USDT',interval:'1h',state:c.state,
      receivedAt:c.received_at,candlesUsed:c.candles_used,
      sourceAgeMinutes:source===null?null:Math.max(0,Math.floor((nowMs-source)/60000))}
  }
  if(!Array.isArray(raw.agents)||raw.agents.length!==8)return null
  const seen=new Set(),agents=[]
  let total=0,familyCount=0
  for(const row of raw.agents){
    if(!object(row)||typeof row.agent!=='string'||!Object.hasOwn(ROLES,row.agent)||seen.has(row.agent))return null
    seen.add(row.agent)
    const owns=ROLES[row.agent]
    if(!Array.isArray(row.families)||row.families.length!==owns.length)return null
    const families=[]
    let scored=0,context=false
    for(let i=0;i<owns.length;i++){
      const family=row.families[i]
      if(!object(family)||family.family!==owns[i]||!count(family.signals_analyzed,10)
        ||!READINGS.has(family.reading))return null
      const hasScore=family.signals_analyzed>0
      if(hasScore===(family.reading==='no_input'||family.reading==='context_only'))return null
      if(raw.schema==='xorus_analysis/v2'&&
        (family.signals_analyzed>({price:4,volume:1,risk:1}[family.family]??0)||family.reading==='context_only'))return null
      scored+=family.signals_analyzed
      context||=family.reading==='context_only'
      if(row.agent!=='chair'&&hasScore)familyCount++
      families.push({family:family.family,count:family.signals_analyzed,reading:family.reading})
    }
    const expected=row.agent==='scribe'?'recorded':
      row.agent==='sentinel'&&raw.decision.reason==='sentinel_veto'?'veto':
      row.agent==='chair'?(scored?'advisory_unverified':'no_input'):
      scored?'paper_unverified':context?'context_only':'no_input'
    if(row.status!==expected)return null
    if(row.agent!=='chair')total+=scored
    agents.push({agent:row.agent,status:expected,families})
  }
  if(total!==coverage.signals_analyzed||familyCount!==coverage.families_analyzed)return null
  if(!Array.isArray(raw.scenarios)||raw.scenarios.length!==SCENARIOS.length
    ||raw.scenarios.some((row,i)=>!object(row)||row.condition!==SCENARIOS[i][0]||row.outcome!==SCENARIOS[i][1]))return null
  // No free-form provider text, URLs, prompts, prices or values leave this boundary.
  // reportId is a content reference, never an authenticity or entitlement proof.
  return Object.freeze({
    reportId:raw.report_sha256,generatedAt:raw.generated_at,
    ageMinutes:Math.max(0,Math.floor((nowMs-generated)/60000)),
    stale:nowMs-generated>=15*60*1000||(source!==null&&nowMs-source>3901000),sourceTimeVerified:false,
    sourceTs:raw.source_ts,collection,
    stance:'ABSTAIN',reason:raw.decision.reason,
    signalsAnalyzed:total,familiesAnalyzed:familyCount,independentlyVerifiedSignals:0,
    agents,rawDataIncluded:false,commercialEnabled:false,executable:false,
  })
}

/** Strip every non-contract field before returning a report from the API. */
export function projectXorusAnalysisReport(raw,nowMs=Date.now()){
  if(!interpretXorusAnalysisReport(raw,nowMs))return null
  const pick=(value,keys)=>Object.fromEntries(keys.map(key=>[key,value[key]]))
  const out=pick(raw,['schema','engine','product','method','mode','generated_at','source_ts',
    'input_provenance','raw_data_included','commercial_enabled','access_granted','confidence','report_sha256'])
  out.decision=pick(raw.decision,['stance','reason'])
  out.coverage=pick(raw.coverage,['signals_defined','signals_analyzed','families_analyzed','independently_verified_signals'])
  out.agents=raw.agents.map(agent=>({...pick(agent,['agent','status']),
    families:agent.families.map(f=>pick(f,['family','signals_analyzed','reading']))}))
  out.scenarios=SCENARIOS.map(([condition,outcome])=>({condition,outcome}))
  out.safety=pick(raw.safety,['executable','live_trading','signing_authorized','trade_authorized',
    'mint_authorized','transfer_authorized','requires_human_review'])
  out.limitations=raw.schema==='xorus_analysis/v2'
    ? ['single_venue_usdt_not_usd','hourly_closed_candles_only','provider_observation_not_independent_attestation',
       'commercial_analysis_rights_not_verified','no_autonomous_execution']
    : ['offline_inputs_not_independently_verified','source_timestamp_unavailable','generation_time_is_not_source_time',
       'commercial_analysis_rights_not_verified','no_autonomous_execution']
  if(raw.schema==='xorus_analysis/v2')out.collection=pick(raw.collection,
    ['provider','instrument','interval','state','received_at','source_max_age_seconds',
     'candles_used','payload_sha256','retry_after_seconds'])
  return out
}
