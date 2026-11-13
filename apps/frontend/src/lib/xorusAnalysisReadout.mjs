/** Allowlisted customer analysis. Never exposes the internal decision board. */
const ROLES={
  scout:['onchain','dex'],tape:['price','volume','volatility','liquidity','funding'],
  crowd:['social'],curator:['art'],sentinel:['risk'],macro:['macro'],chair:['external'],scribe:[],
}
const READINGS=new Set(['no_input','context_only','positive','negative','mixed','balanced'])
const REASONS=new Set(['thin_tape','unverified_tape','sentinel_veto','invalid_market','chair_weight_violation'])
const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)
const count=(v,max)=>Number.isSafeInteger(v)&&v>=0&&v<=max
const SCENARIOS=[
  ['verified_quorum_and_source_review','reassess_analysis'],
  ['sentinel_veto_or_operator_halt','maintain_abstention'],
]

export function interpretXorusAnalysisReport(raw,nowMs=Date.now()){
  if(!object(raw)||raw.schema!=='xorus_analysis/v1'||raw.engine!=='xorus'
    ||raw.product!=='proprietary_analysis'||raw.method!=='deterministic_paper_synthesis/v1'
    ||raw.mode!=='paper_only'||raw.raw_data_included!==false
    ||raw.commercial_enabled!==false||raw.access_granted!==false
    ||raw.input_provenance!=='unverified_offline_inputs'||raw.source_ts!==null||raw.confidence!==null
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
  if(typeof raw.generated_at!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(raw.generated_at))return null
  const generated=Date.parse(raw.generated_at)
  if(!Number.isFinite(generated)||!Number.isFinite(nowMs)||generated>nowMs+60000
    ||new Date(generated).toISOString().slice(0,19)!==raw.generated_at.slice(0,19))return null
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
    stale:nowMs-generated>=15*60*1000,sourceTimeVerified:false,
    stance:'ABSTAIN',reason:raw.decision.reason,
    signalsAnalyzed:total,familiesAnalyzed:familyCount,independentlyVerifiedSignals:0,
    agents,rawDataIncluded:false,commercialEnabled:false,executable:false,
  })
}
