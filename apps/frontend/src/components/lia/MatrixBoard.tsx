/** Compatibility-only stub: retired LIA synthetic Matrix10 widget.
 * The previous component derived TRO and BTC "prices" by multiplying the
 * EGLD price and hardcoded confidence/volatility values. Never revive it as
 * a market-data or decision source. Real analysis is now in xOrus.
 */
import {Link} from 'react-router-dom'

export default function MatrixBoard(){
  return <aside role="note" className="rounded-xl border border-[color:var(--xa-border)] bg-[color:var(--xa-bg-elevated)] p-4 text-sm text-[color:var(--xa-text-secondary)]">
    L’ancienne matrice de démonstration a été retirée : ses prix et scores
    ne provenaient pas de sources indépendantes horodatées.
    <Link to="/intelligence/xorus" className="ml-2 underline underline-offset-2">
      Consulter l’analyse xOrus et ses preuves
    </Link>.
  </aside>
}
