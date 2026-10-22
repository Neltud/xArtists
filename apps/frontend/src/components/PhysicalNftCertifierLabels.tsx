import {localizeChild as xaLocalize, renderChild as xaRender} from '../i18n/phraseRuntime'
/** Libellés i18n pour le certifier (évite de réécrire le gros fichier). */
import { useI18n } from '../i18n/I18nContext'

export function CertifierHeader() {
  const { t } = useI18n()
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.2em] text-fuchsia-300/90 font-tech">{xaRender(t('cert.kicker'))}</p>
      <h2 className="text-lg font-semibold text-white">{xaRender(t('cert.title'))}</h2>
      <p className="text-[12px] text-zinc-400 mt-1 leading-relaxed">{xaRender(t('cert.lead'))}</p>
    </div>
  )
}

export function CertifierFooterHint() {
  const { t } = useI18n()
  return (
    <p className="text-[10px] text-zinc-600 leading-relaxed">
      {xaRender(t('cert.sha.hint'))} · {xaRender(t('cert.hd'))}{xaRender(". Paper only — aucun mint SC automatique. ")}</p>
  )
}
