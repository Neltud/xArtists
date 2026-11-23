/**
 * Editorial ownership, hierarchy and destinations. This is never an access or
 * transaction policy. Legacy groups/URLs remain in modules.ts for compatibility.
 */
export type AreaId = 'art' | 'studio' | 'intelligence' | 'ecosystem' | 'wallet' | 'help' | 'operations'
export type NavigationLevel = 'core' | 'context' | 'advanced' | 'roadmap' | 'operator' | 'legacy'
export type Placement = {area:AreaId;level:NavigationLevel;order:number;label?:string;mergedInto?:string}
export const AREAS = [
  {id:'art',to:'/marketplace',label:'navArt',description:'navArtDesc',icon:'market'},
  {id:'studio',to:'/studio',label:'navStudio',description:'navStudioDesc',icon:'create'},
  {id:'intelligence',to:'/intelligence/xorus',label:'navAgents',description:'navAgentsDesc',icon:'agents'},
  {id:'ecosystem',to:'/finance',label:'navEcosystem',description:'navEcosystemDesc',icon:'network'},
  {id:'wallet',to:'/wallet',label:'navWallet',description:'navWalletDesc',icon:'wallet'},
  {id:'help',to:'/guide',label:'help',description:'guideIntro',icon:'book'},
  {id:'operations',to:'/intelligence/command',label:'navOperations',description:'navOperationsDesc',icon:'command'},
] as const
export const PRIMARY_AREAS = AREAS.slice(0,4)
export const MOBILE_AREAS = [...PRIMARY_AREAS,AREAS[4]]
const p=(area:AreaId,level:NavigationLevel,order:number,label?:string,mergedInto?:string):Placement=>({area,level,order,label,mergedInto})
export const MODULE_PLACEMENT:Record<string,Placement> = {
  market:p('art','core',0), museum:p('art','core',1,'navExhibitions'),
  maison:p('art','context',2,'navCuration'), rwa:p('art','context',3),
  auction:p('art','advanced',4), editions:p('art','advanced',5),
  venues:p('art','advanced',6), tours:p('art','advanced',7), analytics:p('art','advanced',8),
  studio:p('studio','core',0,'navArtwork'), 'gallery-builder':p('studio','core',1,'navExhibitionBuilder'),
  'nft-factory':p('studio','context',2,'navDistribution'), 'world-rights':p('studio','context',3,'navRights'),
  twin:p('studio','advanced',4), ads:p('studio','advanced',5), academy:p('studio','advanced',6),
  lia:p('intelligence','core',0,'navAnalysis'), agents:p('intelligence','core',1,'navAgentCatalogue'),
  packs:p('intelligence','core',2,'navMyAccess'), lab:p('intelligence','context',3,'navLaboratory'),
  lightning:p('intelligence','advanced',4),
  simulation:p('intelligence','legacy',5,undefined,'lab'), entities:p('intelligence','legacy',6,undefined,'lab'),
  dao:p('ecosystem','core',0), tro:p('ecosystem','core',1,'navToken'),
  'tro-crosschain':p('ecosystem','context',2,'navTokenNetworks'), tip:p('ecosystem','context',3),
  trading:p('ecosystem','roadmap',4), staking:p('ecosystem','roadmap',5),
  liquidity:p('ecosystem','roadmap',6), hatom:p('ecosystem','roadmap',7), burnify:p('ecosystem','roadmap',8),
  wallet:p('wallet','core',0,'wallet'), portfolio:p('wallet','legacy',1,undefined,'wallet'),
  account:p('wallet','core',2), identity:p('wallet','context',3),
  payments:p('intelligence','advanced',7,'navLocalIntents'),
  guide:p('help','core',0), app:p('help','core',1), status:p('help','context',2),
  legal:p('help','context',3), sale:p('help','legacy',4),
  command:p('operations','operator',0), history:p('operations','operator',1,'navAgentLogs'),
}
export const areaFor=(id:string):AreaId=>MODULE_PLACEMENT[id]?.area??'help'
export const areaDefinition=(id:AreaId)=>AREAS.find(area=>area.id===id)!
export const moduleLabel=(module:{id:string;label:string})=>MODULE_PLACEMENT[module.id]?.label??module.label
export function isNavigationVisible(id:string,advanced=false):boolean {
  const entry=MODULE_PLACEMENT[id]
  return !!entry&&entry.level!=='legacy'&&(advanced||entry.level==='core'||entry.level==='context')
}
export function navigationRank(id:string):number {
  const entry=MODULE_PLACEMENT[id]
  if(!entry)return 10000
  // The recurring personal entry precedes discovery in command search only.
  return id==='wallet'?-1:AREAS.findIndex(area=>area.id===entry.area)*100+entry.order
}
export function contextualModules<T extends {id:string}>(catalogue:readonly T[],id:string,advanced=false):T[] {
  return catalogue.filter(module=>areaFor(module.id)===areaFor(id)&&isNavigationVisible(module.id,advanced))
    .sort((a,b)=>navigationRank(a.id)-navigationRank(b.id))
}
