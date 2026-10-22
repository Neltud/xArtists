import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
import { LANGS } from '../i18n/types'
import { useI18n } from '../i18n/I18nContext'

export default function LangSwitcher({ compact = true }: { compact?: boolean }) {
  const { lang, setLang, t } = useI18n()

  return (
    <label className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500">
      {xaRender(!compact && <span className="hidden sm:inline">{xaRender(t('lang.label'))}</span>)}
      <select
        value={lang}
        onChange={e => setLang(e.target.value as typeof lang)}
        className="min-h-[44px] rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] text-zinc-200 max-w-[8rem]"
        aria-label={t('lang.label')}
      >
        {xaRender(LANGS.map(l => (
          <option key={l.id} value={l.id}>
            {xaRender(l.native)}
          </option>
        )))}
      </select>
    </label>
  )
}
