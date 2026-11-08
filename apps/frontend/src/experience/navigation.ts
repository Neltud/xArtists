/**
 * Primary navigation reflects the user's *current section*, not just exact
 * link equality. Old URLs and 126+ deployed routes remain addressable.
 * This is editorial navigation only and never grants commercial capability.
 */
export type PrimarySection='explore'|'create'|'market'|'dao'|'guide'

function pathOnly(pathname:string): string {
  const path=pathname.split(/[?#]/,1)[0].replace(/\/+$/,'')
  return path || '/'
}
export function currentPrimarySection(pathname:string):PrimarySection|null {
  const path=pathOnly(pathname)
  if(path==='/guide'||path==='/demo'||path==='/roadmap'||path==='/feuille-de-route')
    return 'guide'
  if(path==='/dao'||path==='/finance/governance'||path.startsWith('/finance/governance/'))
    return 'dao'
  if(['/market','/marketplace','/market-place','/auction','/encheres','/market/analytics']
      .includes(path)||path.startsWith('/explore/market')||
      path.startsWith('/explore/auction'))return 'market'
  if(path==='/studio'||path==='/nft-factory'||path==='/digital-twin'||
      path==='/world-rights'||path==='/plugins/xa-world-rights'||
      path==='/distributeurs'||path.startsWith('/create/'))return 'create'
  if(['/museum','/gallery','/maison','/rwa','/tours','/venues','/editions','/rwa_catalog']
      .includes(path)||path.startsWith('/explore/'))return 'explore'
  return null
}
/**
 * Only the root path matches the homepage. Other paths can match the
 * selected family and its nested alias routes (for marketplace/DAO etc).
 */
export function matchesDockRoute(pathname:string,paths:readonly string[]):boolean {
  const path=pathOnly(pathname)
  return paths.some(candidate=>{
    const route=pathOnly(candidate)
    return path===route||(route!=='/'&&path.startsWith(route+'/'))
  })
}
