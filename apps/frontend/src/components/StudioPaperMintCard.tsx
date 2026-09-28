/**
 * Bouton mint paper E2E — étape 4 Studio.
 */
import { useState } from 'react'
import { mintStudioPaper, listStudioPaperMints } from '../lib/studioPaperMint'

type Props = {
  ready: boolean
  collectionName: string
  ticker: string
  title: string
  description: string
  media: string
  mode: 'digital' | 'physical'
  storage: string
  ipfsUri: string
  youtubeUrl: string
  royalty: number
  metadataJson: string
  artistAddress?: string
}

export default function StudioPaperMintCard(props: Props) {
  const [lastId, setLastId] = useState<string | null>(null)
  const [count, setCount] = useState(() => listStudioPaperMints().length)

  return (
    <div className="card space-y-4 mb-4 border border-emerald-500/20 bg-emerald-500/[0.04]">
      <h2 className="font-bold text-emerald-200">Mint paper E2E (local)</h2>
      <p className="text-xs text-zinc-500">
        Certificat local + intent STUDIO_MINT_PAPER → journal 8008 / Vellum. Pas de tx on-chain tant que SC
        mint OFF.
      </p>
      <button
        type="button"
        className="btn-primary w-full text-sm"
        disabled={!props.ready}
        onClick={() => {
          const m = mintStudioPaper({
            collectionName: props.collectionName,
            ticker: props.ticker,
            title: props.title,
            description: props.description,
            media: props.media,
            mode: props.mode,
            storage: props.storage,
            ipfsUri: props.ipfsUri || undefined,
            youtubeUrl: props.youtubeUrl || undefined,
            royalty: props.royalty,
            metadataJson: props.metadataJson,
            artistAddress: props.artistAddress,
          })
          setLastId(m.id)
          setCount(listStudioPaperMints().length)
        }}
      >
        Mint paper · certificat local
      </button>
      {lastId && (
        <p className="text-[11px] text-emerald-300 mono">
          OK · {lastId} · total {count}
        </p>
      )}
    </div>
  )
}
