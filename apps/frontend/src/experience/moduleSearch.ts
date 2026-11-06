import type { Lang } from '../i18n/types'

/**
 * Pure, Unicode-aware matching for public navigation.
 * Use identical accent-insensitive normalization in the global search and
 * the complete module directory. Search never triggers a wallet/action.
 */
export function foldModuleSearch(value: string, lang: Lang): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase(lang)
    .trim()
}

export function matchesModuleSearch(query: string, candidates: readonly string[], lang: Lang): boolean {
  const needle = foldModuleSearch(query, lang)
  return !needle || foldModuleSearch(candidates.join(' '), lang).includes(needle)
}
