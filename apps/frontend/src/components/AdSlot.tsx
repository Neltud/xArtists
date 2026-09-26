/**
 * Emplacement pub — image d’abord, titre sans doublon, placeholder clair.
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type AdCreative = {
  slot?: string
  title?: string
  imageUrl?: string
  imageCid?: string
  href?: string
  status?: string
  advertiser?: string
  startsAt?: string
  endsAt?: string
}

function isActive(c: AdCreative | undefined): boolean {
  if (!c || c.status === 'inactive') return false
  const now = Date.now()
  if (c.startsAt && Date.parse(c.startsAt) > now) return false
  if (c.endsAt && Date.parse(c.endsAt) < now) return false
  return true
}

function resolveImg(ad: AdCreative): string {
  if (ad.imageUrl) return ad.imageUrl
  if (ad.imageCid) {
    const cid = String(ad.imageCid).replace(/^ipfs:\/\//, '')
    return `https://ipfs.io/ipfs/${cid}`
  }
  return ''
}

export default function AdSlot({
  id,
  className = '',
}: {
  id: string
  className?: string
}) {
  const [ad, setAd] = useState<AdCreative | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [imgOk, setImgOk] = useState(true)

  useEffect(() => {
    let cancelled = false
    const urls = [
      `${import.meta.env.BASE_URL}data/ads_active.json`,
      '/xArtists/data/ads_active.json',
    ]
    ;(async () => {
      for (const u of urls) {
        try {
          const r = await fetch(u, { cache: 'no-store' })
          if (!r.ok) continue
          const j = await r.json()
          const creative = j?.slots?.[id] as AdCreative | undefined
          if (!cancelled && isActive(creative)) {
            setAd(creative!)
            setLoaded(true)
            setImgOk(true)
            return
          }
        } catch {
          /* next */
        }
      }
      if (!cancelled) {
        setAd(null)
        setLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loaded && !ad) {
    return (
      <aside
        className={`rounded-2xl border border-dashed border-amber-400/40 bg-gradient-to-br from-amber-500/10 to-violet-500/5 overflow-hidden ${className}`}
        aria-label="Espace publicitaire disponible"
        data-ad-slot={id}
      >
        <Link
          to="/ads"
          className="block px-4 py-5 text-center hover:bg-white/[0.03] transition-colors"
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/80 mb-1">
            Espace pub · {id}
          </p>
          <p className="text-base font-semibold text-amber-50">Votre publicité ici</p>
          <p className="text-sm text-amber-100/80 mt-1">Enchères · réserver un slot</p>
          <p className="text-[10px] text-zinc-500 mt-2">Paper bid · pas un investissement</p>
        </Link>
      </aside>
    )
  }

  if (!ad) return null

  const img = resolveImg(ad)
  const showTitle = Boolean(ad.title) && (!img || !imgOk)

  const body = (
    <div className="relative">
      {img && imgOk ? (
        <div className="relative aspect-[21/9] sm:aspect-[2.4/1] bg-zinc-900">
          <img
            src={img}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImgOk(false)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          {ad.title && (
            <p className="absolute bottom-2 left-3 right-3 text-sm font-semibold text-white drop-shadow-md line-clamp-2">
              {ad.title}
            </p>
          )}
        </div>
      ) : (
        <div className="px-4 py-5 bg-gradient-to-br from-violet-600/25 to-cyan-600/10">
          {showTitle && (
            <p className="text-sm font-semibold text-white">{ad.title}</p>
          )}
        </div>
      )}
      <p className="text-[10px] uppercase tracking-wide text-zinc-500 px-3 py-2 border-t border-white/5">
        Publicité · enchère xArtists · pas un investissement
      </p>
    </div>
  )

  return (
    <aside
      className={`rounded-2xl border border-white/12 bg-zinc-950/90 overflow-hidden shadow-lg shadow-black/30 ${className}`}
      aria-label="Publicité"
      data-ad-slot={id}
    >
      {ad.href ? (
        <a
          href={ad.href}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block hover:opacity-95 transition-opacity"
        >
          {body}
        </a>
      ) : (
        body
      )}
    </aside>
  )
}
