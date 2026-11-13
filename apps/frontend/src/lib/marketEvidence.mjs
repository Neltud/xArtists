/** Evidence gates for market data. Pure, non-executable, never a trade signal. */
const MAX_PRICE_AGE_MS=15*60*1000
const MAX_FNG_AGE_MS=48*60*60*1000
const SKEW_MS=60*1000
const finite=n=>typeof n==='number'&&Number.isFinite(n)
const dated=(s,now,ttl)=>{
  if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(s))return null
  const ts=Date.parse(s)
  if(!Number.isFinite(ts)||new Date(ts).toISOString().slice(0,19)!==s.slice(0,19))return null
  if(ts>now+SKEW_MS||now-ts>ttl)return null
  return ts
}
export function parseFreshMarketAssets(rows,now=Date.now()){
  if(!Array.isArray(rows))return []
  return rows.filter(row=>{
    if(!row||typeof row!=='object'||Array.isArray(row))return false
    return typeof row.id==='string'&&/^[a-z0-9-]{2,48}$/.test(row.id)
      &&typeof row.symbol==='string'&&/^[a-z0-9]{1,16}$/i.test(row.symbol)
      &&typeof row.name==='string'&&row.name.length<=80
      &&finite(row.current_price)&&row.current_price>0
      &&finite(row.price_change_percentage_24h)
      &&dated(row.last_updated,now,MAX_PRICE_AGE_MS)!==null
  }).map(row=>({
    id:row.id,symbol:row.symbol.toUpperCase(),name:row.name,
    price:row.current_price,change24h:row.price_change_percentage_24h,
    marketCap:finite(row.market_cap)&&row.market_cap>=0?row.market_cap:undefined,
    volume24h:finite(row.total_volume)&&row.total_volume>=0?row.total_volume:undefined,
    sourceUpdatedAt:row.last_updated,
  }))
}
export function parseFreshFearGreed(data,now=Date.now()){
  const row=data?.data?.[0]
  if(!row||typeof row!=='object')return null
  const value=Number(row.value)
  const secs=Number(row.timestamp)
  if(!Number.isInteger(value)||value<0||value>100
    ||!Number.isSafeInteger(secs)||secs<=0)return null
  const ts=new Date(secs*1000).toISOString()
  if(dated(ts,now,MAX_FNG_AGE_MS)===null)return null
  return {value,classification:typeof row.value_classification==='string'
    ?row.value_classification.slice(0,45):'Unavailable',timestamp:ts}
}
export function parseFundingRate(value){
  if(typeof value!=='string'||!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(value))return null
  const n=Number(value)
  if(!Number.isFinite(n)||Math.abs(n)>0.1)return null
  return n*100
}

export function parseFreshFundingQuote(raw,expectedSymbol,now=Date.now()){
  if(!raw||typeof raw!=='object'||Array.isArray(raw)
    ||typeof expectedSymbol!=='string'||raw.symbol!==expectedSymbol
    ||!Number.isSafeInteger(raw.time)||raw.time<=0
    ||raw.time>now+SKEW_MS||now-raw.time>MAX_PRICE_AGE_MS)return null
  const rate=parseFundingRate(raw.lastFundingRate)
  if(rate===null)return null
  return {symbol:expectedSymbol.replace(/USDT$/,''),rate,
    source:'binance',sourceUpdatedAt:new Date(raw.time).toISOString()}
}
