export type Lang = 'fr' | 'en' | 'es' | 'ru' | 'uk' | 'zh' | 'ar'

export const LANGS: { id: Lang; label: string; native: string; dir: 'ltr' | 'rtl' }[] = [
  { id: 'fr', label: 'French', native: 'Français', dir: 'ltr' },
  { id: 'en', label: 'English', native: 'English', dir: 'ltr' },
  { id: 'es', label: 'Spanish', native: 'Español', dir: 'ltr' },
  { id: 'ru', label: 'Russian', native: 'Русский', dir: 'ltr' },
  { id: 'uk', label: 'Ukrainian', native: 'Українська', dir: 'ltr' },
  { id: 'zh', label: 'Chinese', native: '中文', dir: 'ltr' },
  { id: 'ar', label: 'Arabic', native: 'العربية', dir: 'rtl' },
]

export type Dict = Record<string, string>
