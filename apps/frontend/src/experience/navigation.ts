import {areaFor,type AreaId} from './informationArchitecture'
export type PrimarySection=AreaId
export type RouteEntry={id:string;path:string;aliases:readonly string[]}
function pathOnly(pathname:string):string {
 return pathname.split(/[?#]/,1)[0].replace(/\/+$/,'')||'/'
}
/** Resolve against the actual registry, so aliases cannot drift from menus. */
export function currentPrimarySection(pathname:string,catalogue:readonly RouteEntry[]):PrimarySection|null {
 const path=pathOnly(pathname)
 const module=catalogue.find(item=>[item.path,...item.aliases].includes(path))
 if(module)return areaFor(module.id)
 if(/^\/(?:packs|intelligence\/agents)\//.test(path))return 'intelligence'
 if(path.startsWith('/explore/artwork/'))return 'art'
 const hubs:Record<string,AreaId>={explore:'art',create:'studio',intelligence:'intelligence',finance:'ecosystem',workspace:'wallet',maison:'ecosystem',house:'ecosystem',manifesto:'ecosystem',offres:'intelligence',offers:'intelligence',roadmap:'help','feuille-de-route':'help'}
 return hubs[path.slice(1)]??null
}
/** Root is exact; nested route matching always respects a slash boundary. */
export function matchesDockRoute(pathname:string,paths:readonly string[]):boolean {
 const path=pathOnly(pathname)
 return paths.some(candidate=>{const route=pathOnly(candidate);return path===route||(route!=='/'&&path.startsWith(route+'/'))})
}
