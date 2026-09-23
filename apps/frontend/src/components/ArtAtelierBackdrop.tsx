import { TUDURI_WORKS, ATELIER_EXPLORER } from '../config/tuduriAtelier'

/** Ambient gallery of Nelson Tuduri 1/1 oils (NFTUDURI). Decorative, low-opacity. */
export default function ArtAtelierBackdrop() {
  const strip = TUDURI_WORKS.slice(0, 4)
  return (
    <div className="atelier-backdrop pointer-events-none" aria-hidden>
      <div className="atelier-veil" />
      <div className="atelier-strip">
        {strip.map((w, i) => (
          <div
            key={w.id}
            className={`atelier-panel atelier-panel--${i}`}
            style={{ backgroundImage: `url(${w.thumb})` }}
            title={`${w.name} · ${w.year}`}
          />
        ))}
      </div>
      <a
        href={ATELIER_EXPLORER}
        target="_blank"
        rel="noreferrer"
        className="atelier-credit pointer-events-auto"
      >
        Atelier Tuduri · NFTUDURI
      </a>
    </div>
  )
}
