/**
 * Route registry — single source for paths, aliases, spaces, page meta.
 * Five spaces: explore · create · intelligence · finance · space
 * Legacy URLs preserved via aliases.
 */

export type AppSpace = 'explore' | 'create' | 'intelligence' | 'finance' | 'space'

export type RouteMeta = {
  path: string
  /** i18n key for label */
  labelKey: string
  space: AppSpace
  /** Show in primary nav */
  primary?: boolean
  /** Show in mobile bottom nav */
  mobile?: boolean
  titleKey?: string
  descriptionKey?: string
}

/** Canonical module routes */
export const ROUTES: RouteMeta[] = [
  { path: '/', labelKey: 'nav.home', space: 'explore', primary: true, mobile: true, titleKey: 'home.title' },
  { path: '/museum', labelKey: 'nav.museum', space: 'explore', primary: true, mobile: true, titleKey: 'nav.museum' },
  { path: '/market', labelKey: 'nav.market', space: 'explore', primary: true, mobile: true, titleKey: 'market.title' },
  { path: '/rwa', labelKey: 'nav.rwa', space: 'explore', titleKey: 'nav.rwa' },
  { path: '/tours', labelKey: 'nav.tours', space: 'explore' },
  { path: '/gallery', labelKey: 'nav.gallery', space: 'explore' },

  { path: '/studio', labelKey: 'nav.studio', space: 'create', primary: true, titleKey: 'nav.studio' },
  { path: '/digital-twin', labelKey: 'nav.digitalTwin', space: 'create' },
  { path: '/editions', labelKey: 'nav.editions', space: 'create' },

  { path: '/agents', labelKey: 'nav.packs', space: 'intelligence', primary: true, mobile: true, titleKey: 'packs.title' },
  { path: '/command-center', labelKey: 'nav.command', space: 'intelligence', titleKey: 'cc.title' },
  { path: '/lia', labelKey: 'nav.lia', space: 'intelligence', titleKey: 'lia.title' },
  { path: '/tca', labelKey: 'nav.tca', space: 'intelligence' },
  { path: '/sale', labelKey: 'sale.title', space: 'intelligence' },

  { path: '/staking', labelKey: 'nav.staking', space: 'finance', titleKey: 'staking.title' },
  { path: '/lp', labelKey: 'nav.lp', space: 'finance' },
  { path: '/dao', labelKey: 'nav.dao', space: 'finance' },
  { path: '/tro', labelKey: 'nav.tro', space: 'finance' },
  { path: '/hatom', labelKey: 'nav.hatom', space: 'finance' },
  { path: '/trading', labelKey: 'nav.trading', space: 'finance' },

  { path: '/wallet', labelKey: 'nav.wallet', space: 'space', mobile: true, titleKey: 'wallet.title' },
  { path: '/portfolio', labelKey: 'nav.portfolio', space: 'space' },
  { path: '/my-packs', labelKey: 'nav.myPacks', space: 'space' },
  { path: '/identity', labelKey: 'nav.identity', space: 'space' },
  { path: '/legal', labelKey: 'nav.legal', space: 'space' },
]

/** Legacy path → canonical path (preserve query on navigate in App) */
export const ROUTE_ALIASES: Record<string, string> = {
  '/marketplace': '/market',
  '/market-place': '/market',
  '/packs': '/agents',
  '/salles': '/my-packs',
  '/command': '/command-center',
  '/cc': '/command-center',
  '/classroom': '/tca',
  '/mentions-legales': '/legal',
  '/legal/terms': '/legal',
  '/rwa_catalog': '/rwa',
  '/entity': '/entities',
  '/sim': '/simulation',
  '/hub': '/',
  '/slot': '/',
}

export const SPACE_META: Record<
  AppSpace,
  { labelKey: string; descriptionKey: string; hubPath: string }
> = {
  explore: {
    labelKey: 'space.explore',
    descriptionKey: 'space.explore.desc',
    hubPath: '/museum',
  },
  create: {
    labelKey: 'space.create',
    descriptionKey: 'space.create.desc',
    hubPath: '/studio',
  },
  intelligence: {
    labelKey: 'space.intelligence',
    descriptionKey: 'space.intelligence.desc',
    hubPath: '/agents',
  },
  finance: {
    labelKey: 'space.finance',
    descriptionKey: 'space.finance.desc',
    hubPath: '/staking',
  },
  space: {
    labelKey: 'space.mine',
    descriptionKey: 'space.mine.desc',
    hubPath: '/wallet',
  },
}

/** Primary top nav (desktop) */
export function primaryNavRoutes(): RouteMeta[] {
  return ROUTES.filter(r => r.primary)
}

/** Mobile bottom nav */
export function mobileNavRoutes(): RouteMeta[] {
  return ROUTES.filter(r => r.mobile)
}

export function resolveAlias(pathname: string): string | null {
  if (ROUTE_ALIASES[pathname]) return ROUTE_ALIASES[pathname]
  if (pathname.startsWith('/slot/')) return '/'
  return null
}

export function spaceForPath(pathname: string): AppSpace | null {
  const exact = ROUTES.find(r => r.path === pathname)
  if (exact) return exact.space
  const prefix = ROUTES.filter(r => r.path !== '/' && pathname.startsWith(r.path + '/'))
  if (prefix.length) return prefix.sort((a, b) => b.path.length - a.path.length)[0].space
  return null
}
