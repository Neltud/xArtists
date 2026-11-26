// Local game progress only; no wallet, rewards, account entitlement or NFT ownership.
export const WORLD_IDS=Object.freeze(['museum','hall','hangar','garage','boutique','glasshouse','outdoor'])
export const WORLD_KEY='xa.art-world.progress.v1'
export function normalizeProgress(value){
 const valid=value&&typeof value==='object'?value:{}
 const unique=(items,check,max)=>Array.isArray(items)?[...new Set(items.filter(check))].slice(0,max):[]
 return {space:WORLD_IDS.includes(valid.space)?valid.space:'museum',
   visited:unique(valid.visited,v=>WORLD_IDS.includes(v),7),
   inspected:unique(valid.inspected,v=>typeof v==='string'&&v.length>0&&v.length<=200,500)}
}
export function enterSpace(progress,space){
 const p=normalizeProgress(progress)
 if(!WORLD_IDS.includes(space))return p
 return normalizeProgress({...p,space,visited:[...p.visited,space]})
}
export function inspectArt(progress,id){
 const p=normalizeProgress(progress)
 return normalizeProgress({...p,inspected:[...p.inspected,id]})
}
export function readProgress(storage){
 try{return normalizeProgress(JSON.parse(storage.getItem(WORLD_KEY)||'null'))}catch{return normalizeProgress(null)}
}
export function saveProgress(storage,progress){
 try{storage.setItem(WORLD_KEY,JSON.stringify(normalizeProgress(progress)));return true}catch{return false}
}
