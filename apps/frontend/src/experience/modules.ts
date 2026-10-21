/** V3 module registry — navigation + route surface */
export type ModuleCategory =
  | 'home'
  | 'create'
  | 'discover'
  | 'trade'
  | 'agents'
  | 'finance'
  | 'social'
  | 'system'

export type ModuleDef = {
  id: string
  path: string
  titleKey: string
  category: ModuleCategory
  nav?: boolean
  mobile?: boolean
}

/** Canonical V3 module list (36 modules). */
export const MODULES: ModuleDef[] = [
  { id: 'home', path: '/', titleKey: 'nav.home', category: 'home', nav: true, mobile: true },
  { id: 'explore', path: '/explore', titleKey: 'nav.explore', category: 'discover', nav: true, mobile: true },
  { id: 'museum', path: '/museum', titleKey: 'nav.museum', category: 'discover', nav: true, mobile: true },
  { id: 'gallery', path: '/gallery', titleKey: 'nav.gallery', category: 'discover', nav: true },
  { id: 'marketplace', path: '/marketplace', titleKey: 'nav.marketplace', category: 'trade', nav: true, mobile: true },
  { id: 'create', path: '/create', titleKey: 'nav.create', category: 'create', nav: true },
  { id: 'agents', path: '/agents', titleKey: 'nav.agents', category: 'agents', nav: true, mobile: true },
  { id: 'lia', path: '/lia', titleKey: 'nav.lia', category: 'agents', nav: true },
  { id: 'command-center', path: '/command-center', titleKey: 'nav.command', category: 'system', nav: true },
  { id: 'dashboard', path: '/dashboard', titleKey: 'nav.dashboard', category: 'home', nav: true, mobile: true },
  { id: 'wallet', path: '/wallet', titleKey: 'nav.wallet', category: 'finance', nav: true, mobile: true },
  { id: 'staking', path: '/staking', titleKey: 'nav.staking', category: 'finance', nav: true },
  { id: 'governance', path: '/governance', titleKey: 'nav.governance', category: 'finance' },
  { id: 'tro', path: '/tro', titleKey: 'nav.tro', category: 'finance' },
  { id: 'bridge', path: '/bridge', titleKey: 'nav.bridge', category: 'finance' },
  { id: 'analytics', path: '/analytics', titleKey: 'nav.analytics', category: 'discover' },
  { id: 'news', path: '/news', titleKey: 'nav.news', category: 'social' },
  { id: 'social', path: '/social', titleKey: 'nav.social', category: 'social' },
  { id: 'tours', path: '/tours', titleKey: 'nav.tours', category: 'discover' },
  { id: 'venue', path: '/venue', titleKey: 'nav.venue', category: 'discover' },
  { id: 'atelier', path: '/atelier', titleKey: 'nav.atelier', category: 'create' },
  { id: 'collections', path: '/collections', titleKey: 'nav.collections', category: 'discover' },
  { id: 'profile', path: '/profile', titleKey: 'nav.profile', category: 'social', mobile: true },
  { id: 'settings', path: '/settings', titleKey: 'nav.settings', category: 'system' },
  { id: 'access', path: '/access', titleKey: 'nav.access', category: 'system' },
  { id: 'tca', path: '/tca', titleKey: 'nav.tca', category: 'system' },
  { id: 'docs', path: '/docs', titleKey: 'nav.docs', category: 'system' },
  { id: 'status', path: '/status', titleKey: 'nav.status', category: 'system' },
  { id: 'signals', path: '/signals', titleKey: 'nav.signals', category: 'agents' },
  { id: 'packs', path: '/packs', titleKey: 'nav.packs', category: 'agents' },
  { id: 'yield', path: '/yield', titleKey: 'nav.yield', category: 'finance' },
  { id: 'guardian', path: '/guardian', titleKey: 'nav.guardian', category: 'agents' },
  { id: 'onramp', path: '/onramp', titleKey: 'nav.onramp', category: 'finance' },
  { id: 'activity', path: '/activity', titleKey: 'nav.activity', category: 'social' },
  { id: 'help', path: '/help', titleKey: 'nav.help', category: 'system' },
  { id: 'legal', path: '/legal', titleKey: 'nav.legal', category: 'system' },
]

export function moduleByPath(pathname: string): ModuleDef | undefined {
  const clean = pathname.replace(/\/+$/, '') || '/'
  return MODULES.find(m => m.path === clean)
}

export function navModules(mobile = false): ModuleDef[] {
  return MODULES.filter(m => m.nav && (!mobile || m.mobile))
}
