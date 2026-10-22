import {localizeChild as xaLocalize, renderChild as xaRender} from '../../i18n/phraseRuntime'
/**
 * Salle holder Pulse — paper ou NFT pack.
 * Accès UI seulement (localStorage forgeable) — jamais un droit on-chain.
 */
import { Link } from 'react-router-dom'
import MuseumHall from './MuseumHall'
import type { FrameItem } from './MuseumCorridor'
import { builtinBlueprintForMuseum } from '../../lib/builtinBlueprints'
import { holderStatus, canEnterPulseRoom } from '../../lib/holderAccess'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'

export default function HolderPulseTab({
  nfts,
  frames,
  connected,
}: {
  nfts: Array<{ identifier: string; collection?: string; name?: string }>
  frames: FrameItem[]
  connected: boolean
}) {
  const { address } = useWallet()
  const status = holderStatus(nfts, address)
  const allowed = canEnterPulseRoom(status)
  const bp = builtinBlueprintForMuseum('xartists')
  const paperOnly = status.any && status.onchain.length === 0

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-violet-500/20 bg-violet-950/20 px-5 py-10 text-center space-y-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-violet-300/80">{xaRender("Salle Pulse")}</p>
        <h2 className="text-xl font-semibold text-white">{xaRender("Réservée holders")}</h2>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          {xaRender("Un pack Pulse (paper sur cet appareil ou NFT) déverrouille la salle cyber. Accès démo — pas une preuve on-chain tant que le mint SC est OFF. ")}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link to="/agents" className="btn-primary text-sm">
            {xaRender("Obtenir Pulse ")}</Link>
          {xaRender(!connected && (
            <button type="button" className="btn-secondary text-sm" onClick={() => requestOpenConnect()}>
              {xaRender("Connecter wallet ")}</button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 px-3 py-2 text-[12px] text-emerald-100/90 space-y-1">
        <div className="flex flex-wrap gap-2 justify-between">
          <span>
            {xaRender("Holder ")}{xaRender(status.pulse ? 'Pulse' : status.packs.join(', '))}
            {xaRender(status.paper.length ? ' · paper device' : '')}
            {xaRender(status.onchain.length ? ' · on-chain' : '')}
          </span>
          <span className="text-emerald-200/70">{xaRender("salle cyber · UI only")}</span>
        </div>
        {xaRender(paperOnly && (
          <p className="text-[11px] text-amber-200/85">
            {xaRender("Accès paper local — modifiable dans le navigateur. Ce n’est pas une autorisation on-chain. ")}</p>
        ))}
      </div>
      <div className="rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl shadow-cyan-950/40">
        <MuseumHall
          blueprint={bp}
          frames={frames}
          room="cyber"
          allowBuy={false}
          emptyLabel="Salle Pulse — accrochage en cours…"
        />
      </div>
    </div>
  )
}
