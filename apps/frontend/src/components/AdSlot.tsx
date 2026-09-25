/**
 * Emplacement pub — créative active ou placeholder « Votre publicité ici · Enchères ».
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

export default function AdSlot({
  id,
  className = '',
}: {
  id: string
  className?: string
}) {
  const [ad, setAd] = useState<AdCreative | null>(null)
  const [loaded, setLoaded] = useState(false)

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

  // Placeholder — inventaire libre
  if (loaded && !ad) {
    return (
      <aside
        className={`rounded-xl border border-dashed border-amber-500/35 bg-amber-950/10 overflow-hidden ${className}`}
        aria-label="Espace publicitaire disponible"
        data-ad-slot={id}
      >
        <Link
          to="/ads"
          className="block px-4 py-5 text-center hover:bg-amber-500/5 transition-colors"
        >
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/70 mb-1">
            Espace pub · {id}
          </p>
          <p className="text-base font-semibold text-amber-100">Votre publicité ici</p>
          <p className="text-sm text-amber-200/80 mt-1">Enchères · réserver un slot</p>
          <p className="text-[10px] text-zinc-600 mt-2">Paper bid · pas un investissement</p>
        </Link>
      </aside>
    )
  }

  if (!ad) return null

  const img =
    ad.imageUrl ||
    (ad.imageCid
      ? `https://ipfs.io/ipfs/${String(ad.imageCid).replace(/^ipfs:\/\//, '')}`
      : '')

  const inner = (
    <>
      {img ? (
        <img
          src={img}
          alt={ad.title || 'Publicité xArtists'}
          className="w-full h-auto rounded-lg object-cover max-h-40 sm:max-h-48"
          loading="lazy"
        />
      ) : null}
      {ad.title ? (
        <p className="text-sm text-gray-200 mt-2 font-medium px-1">{ad.title}</p>
      ) : null}
      <p className="text-[10px] uppercase tracking-wide text-gray-500 mt-1 px-1">
        Publicité · enchère xArtists · pas un investissement
      </p>
    </>
  )

  return (
    <aside
      className={`border border-[#2a2a3a] rounded-xl bg-[#12121a]/80 overflow-hidden ${className}`}
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
          {inner}
        </a>
      ) : (
        <div className="p-1">{inner}</div>
      )}
    </aside>
  )
}
