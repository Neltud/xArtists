import { useEffect, useState } from 'react'

export type AdCreative = {
  slot: string
  title?: string
  imageUrl?: string
  imageCid?: string
  href?: string
  startsAt?: string
  endsAt?: string
  status?: string
  advertiser?: string
}

type Props = {
  id: 'home_hero' | 'market_sidebar' | 'studio_banner' | 'drop_feature'
  className?: string
}

function isActive(ad: AdCreative, now = Date.now()): boolean {
  if (ad.status && ad.status !== 'active' && ad.status !== 'scheduled') return false
  const start = ad.startsAt ? Date.parse(ad.startsAt) : 0
  const end = ad.endsAt ? Date.parse(ad.endsAt) : Number.POSITIVE_INFINITY
  if (Number.isFinite(start) && now < start) return false
  if (Number.isFinite(end) && now > end) return false
  return Boolean(ad.imageUrl || ad.title)
}

/**
 * Premium ad slot — max one creative per id from ads_active.json.
 * Always labeled as auction advertising (not investment).
 */
export default function AdSlot({ id, className = '' }: Props) {
  const [ad, setAd] = useState<AdCreative | null>(null)

  useEffect(() => {
    let cancelled = false
    const url = `${import.meta.env.BASE_URL}data/ads_active.json?t=${Date.now()}`
    fetch(url, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j?.slots?.[id]) return
        const creative = j.slots[id] as AdCreative
        if (isActive(creative)) setAd(creative)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [id])

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
        <div>{inner}</div>
      )}
    </aside>
  )
}
