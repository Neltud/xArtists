/** Packs = produits limités · pas un investissement */
export default function PackProductDisclaimer({ className = '' }: { className?: string }) {
  return (
    <aside
      className={`rounded-xl border border-amber-500/25 bg-amber-950/15 px-4 py-3 text-[12px] text-amber-100/90 leading-relaxed ${className}`}
      role="note"
    >
      <p className="font-semibold text-amber-50/95 mb-1">Produit · pas un investissement</p>
      <p>
        Les packs Agents IA (Pulse · Yield · Sentinel) sont des <strong>produits numériques uniques et
        limités</strong> (accès, signaux, expérience). Ce ne sont pas des titres financiers, ni une
        part de fonds. Toute allocation ou reward LIA est discrétionnaire — aucune promesse de
        rendement. La revente éventuelle d’un NFT agent se fait sur le marketplace comme œuvre /
        utilitaire, au prix libre entre utilisateurs.
      </p>
    </aside>
  )
}
