/** Canonical xOrus status; read old deployments without hiding conflicting flags. */
const KEYS=['xorus_live_trading','XORUS_LIVE_TRADING','lia_live_trading','LIA_LIVE_TRADING']
const off=value=>value===false||value===0||value==='0'||value==='false'
const on=value=>value===true||value===1||value==='1'||value==='true'
const values=doc=>doc&&typeof doc==='object'?
  KEYS.filter(key=>Object.hasOwn(doc,key)).map(key=>doc[key]):[]

export function isTradingDisabled(doc){
  const flags=values(doc)
  return flags.length>0&&flags.every(off)
}

export function isTradingEnabled(doc){return values(doc).some(on)}
