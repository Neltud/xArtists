/** Public fee copy — no SC jargon. */

type Kind = 'market' | 'slot-paper' | 'packs'

const COPY: Record<Kind, { title: string; lines: string[] }> = {
  market: {
    title: 'Frais à la vente',
    lines: [
      'Marché 2,5 %',
      'Royalty créateur 5 % (max 7,5 % avec le fee)',
      'Vendeur ≈ 92,5 %',
    ],
  },
  'slot-paper': {
    title: 'Simulation Fun',
    lines: [
      '35 % de la mise → cagnotte écran (non retirable)',
      '70 % des gains table → crédits paper',
      '30 % des gains table → LIA paper',
    ],
  },
  packs: {
    title: 'Répartition pack',
    lines: [
      '45 % artistes',
      '25 % protocole',
      '15 % trésorerie',
      '10 % pool signaux',
      '5 % buffer',
    ],
  },
}

export default function FeeTransparency({ kind }: { kind: Kind }) {
  const c = COPY[kind]
  return (
    <aside className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-[12px] text-zinc-400 space-y-1">
      <p className="text-[11px] uppercase tracking-wider text-zinc-500">{c.title}</p>
      <ul className="space-y-0.5">
        {c.lines.map(l => (
          <li key={l}>· {l}</li>
        ))}
      </ul>
    </aside>
  )
}
