/**
 * Wrapper visuel ownership — glow si le wallet possède identifier/collection.
 * Utilisable grille musée / marketplace sans Three.js obligatoire.
 */
import type { ReactNode } from 'react'
import { isOwnedByWallet, OWNED_GLOW } from '../lib/ownershipMap'

type Props = {
  ownedIds: Set<string>
  identifier?: string
  collection?: string
  nonce?: number
  children: ReactNode
  className?: string
}

export default function OwnedNftGlow({
  ownedIds,
  identifier,
  collection,
  nonce,
  children,
  className = '',
}: Props) {
  const owned = isOwnedByWallet(ownedIds, { identifier, collection, nonce })
  return (
    <div
      className={`${className} ${owned ? `${OWNED_GLOW.border} ${OWNED_GLOW.ring}` : 'border-transparent'}`}
      style={owned ? { boxShadow: OWNED_GLOW.shadow } : undefined}
      data-owned={owned ? '1' : '0'}
    >
      {owned && (
        <span className="absolute top-2 left-2 z-10 text-[9px] font-bold uppercase tracking-wider text-emerald-200 bg-emerald-500/20 border border-emerald-400/40 rounded-full px-2 py-0.5">
          Owned
        </span>
      )}
      {children}
    </div>
  )
}
