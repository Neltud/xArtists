/**
 * xOrus FREE-source policy and conservative offline corroboration candidate.
 *
 * These rights cover only data/objects explicitly in the stated scope.
 * Rights to publish original derivative analysis != permission to resell
 * raw data. This module NEVER verifies a market price, grants paid access,
 * executes a trade or treats two mirrors of the same data as independent.
 */
const SOURCES=Object.freeze({
  eurostat:Object.freeze({
    id:'eurostat',label:'Eurostat — EU-owned statistics',
    source_domain:'europa.eu',origin:'eurostat',
    permission:'EU reuse policy — commercial reuse with attribution, third-party exceptions',
    rights_url:'https://ec.europa.eu/eurostat/help/copyright-notice',
    license_ref:'EC-2011-833-EU-Eurostat-Reuse',
    scoped_free_commercial_derivatives:true,requires_attribution:true,
    requires_item_review:true,kind:'macro_statistics',
  }),
  'met-cc0':Object.freeze({
    id:'met-cc0',label:'The Met — Open Access objects only',
    source_domain:'metmuseum.org',origin:'metropolitan-museum-open-access',
    permission:'CC0 Open Access objects only; copyright/restrictions outside OA excluded',
    rights_url:'https://www.metmuseum.org/fr/policies/terms-and-conditions',
    license_ref:'CC0-Met-OpenAccess',
    scoped_free_commercial_derivatives:true,requires_attribution:false,
    requires_item_review:true,kind:'art_open_access',
  }),
  'smithsonian-cc0':Object.freeze({
    id:'smithsonian-cc0',label:'Smithsonian Open Access CC0',
    source_domain:'si.edu',origin:'smithsonian-open-access',
    permission:'CC0-marked items only; third-party/trademark/personality rights excluded',
    rights_url:'https://www.si.edu/openaccess/faq',
    license_ref:'CC0-Smithsonian-OpenAccess',
    scoped_free_commercial_derivatives:true,requires_attribution:false,
    requires_item_review:true,kind:'art_open_access',
  }),
})
const BLOCKED=Object.freeze([
  'coingecko-demo','binance-vision','binance-spot','artprice',
  'opensea','social-unknown','multiversx-public-api',
])
const validDate=(s)=>typeof s==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(s)&&
  !Number.isNaN(Date.parse(s))&&new Date(s).toISOString().replace('.000Z','Z')===s
const validItem=(entry,obs)=>{
  if(!entry||!obs||typeof obs!=='object'||Array.isArray(obs))return false
  if(obs.license_ref!==entry.license_ref)return false
  if(entry.id==='eurostat')return obs.rights_scope==='eurostat_owned'&&
    obs.third_party_content===false&&typeof obs.dataset_id==='string'&&
    /^[A-Za-z0-9_.-]{3,90}$/.test(obs.dataset_id)&&obs.attribution_present===true
  return obs.rights_scope==='CC0'&&obs.is_public_domain===true&&
    obs.third_party_content===false&&typeof obs.object_id==='string'&&
    /^[A-Za-z0-9-]{1,80}$/.test(obs.object_id)
}

export function publicFreeSourcePolicy(){
  return Object.freeze({
    ok:true,mode:'read_only',free_only:true,
    commercial_feed_resale_allowed:false,
    licensed_derived_analysis_possible:true,
    commercial_enabled:false,
    autonomously_trading:false,
    independently_verified_signals:0,
    evidence_attested:false,
    item_rights_review_required:true,
    sources:Object.values(SOURCES).map(s=>({...s})),
    blocked_source_ids:[...BLOCKED],
    note:'Static rights scope, not proof of any collected item or market observation.',
  })
}

/**
 * Offline precheck only. Independent publishers can mirror a common upstream
 * feed, so the independence domain is the origin, never the host/API hostname.
 * Evidence signatures & scope must be audited independently to promote a
 * candidate to verified. No raw values escape this projection.
 */
export function crosscheckOpenSourceCandidates(rows,{now=Date.now(),ttlMs=900000,maxDifferenceRatio=0.02}={}){
  const base={ok:false,status:'ABSTAIN',reason:'insufficient_free_sources',
    candidate_only:true,independently_verified_signals:0,
    commercial_enabled:false,executable:false,trade_authorized:false,
    source_count:0,independent_origins:0,checked_at:Number.isFinite(now)
      ?new Date(now).toISOString():null}
  if(!Number.isFinite(now)||!Number.isInteger(ttlMs)||ttlMs<1||
    typeof maxDifferenceRatio!=='number'||maxDifferenceRatio<=0||
    maxDifferenceRatio>0.05)return {...base,reason:'invalid_crosscheck_policy'}
  if(!Array.isArray(rows)||rows.length>32)return {...base,reason:'invalid_input'}
  const groups=new Map()
  for(const row of rows){
    if(!row||typeof row!=='object'||Array.isArray(row)||
       typeof row.metric!=='string'||!/^[a-z][a-z0-9_.]{2,64}$/.test(row.metric)||
       typeof row.unit!=='string'||!/^[a-zA-Z%_]{1,20}$/.test(row.unit)||
       typeof row.value!=='number'||!Number.isFinite(row.value)||
       !validDate(row.observed_at)||Math.abs(now-Date.parse(row.observed_at))>ttlMs)continue
    const entry=SOURCES[row.source_id]
    if(!validItem(entry,row))continue
    const key=row.metric+'|'+row.unit
    if(!groups.has(key))groups.set(key,new Map())
    // Multiple mirrors or endpoints sharing the same original dataset count once.
    const origin=entry.origin
    if(!groups.get(key).has(origin))groups.get(key).set(origin,row.value)
  }
  const findings=[]
  for(const [key,origins] of groups){
    if(origins.size<2)continue
    const vals=[...origins.values()]
    const range=Math.max(...vals)-Math.min(...vals)
    const baseMagnitude=Math.max(1,...vals.map(Math.abs))
    const spread=range/baseMagnitude
    if(spread<=maxDifferenceRatio)findings.push({metric:key.split('|')[0],
      unit:key.split('|')[1],sources:origins.size,status:'corroboration_candidate'})
  }
  if(!findings.length)return {...base,reason:'no_independent_candidate',
    source_count:rows.length,independent_origins:0}
  return {...base,ok:true,reason:'independent_candidate_not_attested',
    source_count:rows.length,
    independent_origins:Math.max(...findings.map(x=>x.sources)),
    findings,
  }
}
