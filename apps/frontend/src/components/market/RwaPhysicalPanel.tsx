import {localizeChild as xaLocalize, renderChild as xaRender} from '../../i18n/phraseRuntime'
/**
 * RWA Physical Art panel — certificats de provenance (pas d'agrégateur Frameit).
 */
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext'

export default function RwaPhysicalPanel() {
  const { t } = useI18n()
  return (
    <section className="rounded-xl border border-amber-500/20 bg-black/40 p-4 backdrop-blur-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-white">
          {xaRender(t('market.rwa.title') || 'RWA Physical Art')}
        </h2>
        <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-100">
          {xaRender(t('market.rwa.badge') || 'Provenance on-chain')}
        </span>
      </div>
      <div className="space-y-2 text-sm text-white/75">
        <p>
          {xaRender(t('market.rwa.body') ||
            'Oeuvres physiques liees : dimensions, medium, chip NFC optionnel, certificat NFT MultiversX.')}
        </p>
        <ul className="list-inside list-disc space-y-1 text-white/60">
          <li>{xaRender(t('market.rwa.li1') || 'Record de provenance → metadata IPFS + NFT certificat')}</li>
          <li>{xaRender(t('market.rwa.li2') || 'NFC chip ID pour verification phygitale')}</li>
          <li>{xaRender(t('market.rwa.li3') || 'Escrow / livraison : bridge P2 (rwa_escrow)')}</li>
        </ul>
        <div className="flex flex-wrap gap-2 pt-2">
          <Link
            to="/studio"
            className="rounded-md bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-500/30"
          >
            {xaRender("Studio Phygital ")}</Link>
          <Link
            to="/agents"
            className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5"
          >
            {xaRender(t('nav.packs') || 'Packs Agents')}
          </Link>
        </div>
      </div>
    </section>
  )
}
