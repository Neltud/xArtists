import { LANGS } from '../i18n/types'
import { useI18n } from '../i18n/I18nContext'

export default function LangSwitcher({ compact = true }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n()

  return (
    <label className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500">
      {!compact && <span className="hidden sm:inline">{t('lang.label')}</span>}
      <select
        value={lang}
        onChange={e => setLang(e.target.value as typeof lang)}
        className="rounded-lg border border-white/10 bg-black/40 px-1.5 py-1 text-[11px] text-zinc-200 max-w-[7.5rem]"
        aria-label={t('lang.label')}
      >
        {LANGS.map(l => (
          <option key={l.id} value={l.id}>
            {l.native}
          </option>
        ))}
      </select>
    </label>
  )
}
