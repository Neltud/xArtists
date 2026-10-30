import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { normalizePublicPath } from '../lib/publicRoutes'
export type Group = 'explore' | 'create' | 'intelligence' | 'finance' | 'workspace'
export type Module = { id: string; path: string; aliases: string[]; label: string; group: Group; icon: string; page: LazyExoticComponent<ComponentType<any>>; tags: string[]; load: ()=>Promise<any> }
const module = (id:string,path:string,aliases:string[],label:string,group:Group,icon:string,page:()=>Promise<any>,tags:string[]=[]):Module => ({id,path,aliases,label,group,icon,page:lazy(page),tags,load:page})
export const modules:Module[] = [
  module('app','/app',['/install','/mobile'],'appAccess','workspace','globe',()=>import('../pages/DappAccessPage'),['xPortal','iOS','Android','PWA']),
  module('museum','/explore/museum',['/museum','/gallery'],'museum','explore','museum',()=>import('../pages/MuseumPage'),['3D','WebGL','NFT']),
  module('market','/explore/market',['/market','/marketplace','/market-place'],'market','explore','market',()=>import('../pages/MarketplacePage'),['NFT','RWA','SFT']),
  module('analytics','/explore/analytics',['/market/analytics'],'analytics','explore','chart',()=>import('../pages/MarketAnalyticsPage'),['NFT','EGLD']),
  module('tours','/explore/tours',['/tours','/agents/voyage','/intelligence/voyage'],'tours','explore','globe',()=>import('../pages/ArtToursPage'),['Art','Culture']),
  module('rwa','/explore/rwa',['/rwa','/rwa_catalog'],'rwa','explore','cube',()=>import('../pages/RwaCatalogPage'),['RWA','NFC']),
  module('editions','/explore/editions',['/editions'],'editions','explore','layers',()=>import('../pages/Editions'),['SFT','Art']),
  module('venues','/explore/venues',['/venues'],'venues','explore','museum',()=>import('../pages/VenuePage'),['Art','RWA']),
  module('studio','/create/studio',['/studio'],'studio','create','create',()=>import('../pages/StudioPage'),['NFT','RWA','Mint']),
  module('twin','/create/digital-twin',['/digital-twin'],'twin','create','cube',()=>import('../pages/DigitalTwinPage'),['RWA','3D']),
  module('academy','/create/academy',['/tca','/classroom'],'academy','create','book',()=>import('../pages/TcaGatePage'),['TCA','Sfumato']),
  module('ads','/create/visibility',['/ads'],'ads','create','globe',()=>import('../pages/AdsPage'),['Art','Media']),
  module('lia','/intelligence/lia',['/lia'],'lia','intelligence','orb',()=>import('../pages/LiaPage'),['LIA','AI','Paper']),
  module('agents','/intelligence/agents',['/agents','/packs'],'agents','intelligence','agents',()=>import('../pages/AgentsPage'),['Pulse','Yield','Sentinel']),
  module('command','/intelligence/command',['/command-center','/command','/cc'],'command','intelligence','command',()=>import('../pages/CommandCenterPage'),['LIA','AI','Ops']),
  module('lightning','/intelligence/lightning',['/agents/lightning'],'lightning','intelligence','bolt',()=>import('../pages/LightningAgentPage'),['AI','Lightning']),
  module('simulation','/intelligence/simulation',['/simulation','/sim'],'simulation','intelligence','chart',()=>import('../pages/SimulationLab'),['Paper','Lab']),
  module('entities','/intelligence/network',['/entities','/entity'],'entities','intelligence','network',()=>import('../pages/EntityMap'),['LIA','Network']),
  module('trading','/finance/trading',['/trading'],'trading','finance','chart',()=>import('../pages/TradingPage'),['EGLD','Trade']),
  module('tro','/finance/tro',['/tro'],'tro','finance','coin',()=>import('../pages/TroPage'),['TRO','Token']),
  module('staking','/finance/staking',['/staking'],'staking','finance','layers',()=>import('../pages/StakingPage'),['TRO','NFT','Stake']),
  module('liquidity','/finance/liquidity',['/lp'],'liquidity','finance','layers',()=>import('../pages/LPPoolsPage'),['LP','DeFi']),
  module('hatom','/finance/hatom',['/hatom'],'hatom','finance','orb',()=>import('../pages/HatomPage'),['HTM','sEGLD','DeFi']),
  module('burnify','/finance/burnify',['/burnify'],'burnify','finance','bolt',()=>import('../pages/BurnifyPage'),['Burn','DeFi']),
  module('dao','/finance/governance',['/dao'],'dao','finance','network',()=>import('../pages/DaoPage'),['DAO','TRO']),
  module('sale','/finance/sale',['/sale'],'sale','finance','coin',()=>import('../pages/SalePage'),['TRO','EGLD']),
  module('tip','/finance/support',['/tip'],'tip','finance','heart',()=>import('../pages/TipPage'),['EGLD','TRO']),
  module('wallet','/workspace/wallet',['/wallet'],'wallet','workspace','wallet',()=>import('../pages/WalletPage'),['xPortal','WalletConnect']),
  module('portfolio','/workspace/portfolio',['/portfolio'],'portfolio','workspace','layers',()=>import('../pages/PortfolioPage'),['NFT','EGLD','TRO']),
  module('packs','/workspace/agents',['/my-packs','/salles'],'packs','workspace','agents',()=>import('../pages/MyPacksPage'),['Pulse','Yield','Sentinel']),
  module('identity','/workspace/identity',['/identity'],'identity','workspace','user',()=>import('../pages/IdentityPage'),['Profile','Identity']),
  module('payments','/workspace/payments',['/payments'],'payments','workspace','clock',()=>import('../pages/PaymentHistory'),['EGLD','History']),
  module('history','/workspace/history',['/history'],'history','workspace','clock',()=>import('../pages/HistoryPage'),['History','LIA']),
  module('status','/workspace/status',['/go-live'],'status','workspace','shield',()=>import('../pages/GoLivePage'),['Mainnet','SC']),
  module('legal','/legal',['/legal/terms','/mentions-legales'],'legal','workspace','shield',()=>import('../pages/LegalPage'),['Terms','Legal']),
  module('guide','/guide',['/demo'],'help','explore','book',()=>import('../pages/DemoTourPage'),['Demo','Guide']),
]
export const groups:Group[]=['explore','create','intelligence','finance','workspace']
export function findModule(path:string){const normalized=normalizePublicPath(path);return modules.find(m=>m.path===normalized||m.aliases.includes(normalized))}
