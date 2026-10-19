import {localizeChild as xaLocalize, renderChild as xaRender} from '../../i18n/phraseRuntime'
/** Crosshair / direction reticle for first-person museum view. */
export default function NavReticle({ moving = false }: { moving?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-10" aria-hidden>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="3" stroke="rgba(255,255,255,0.55)" strokeWidth="1.2" />
        <line x1="14" y1="2" x2="14" y2="8" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
        <line x1="14" y1="20" x2="14" y2="26" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
        <line x1="2" y1="14" x2="8" y2="14" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
        <line x1="20" y1="14" x2="26" y2="14" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
        {xaRender(moving && (
          <polygon
            points="14,5 17,10 11,10"
            fill="rgba(34,211,238,0.9)"
            className="origin-center"
            style={{ transformOrigin: '14px 14px', animation: 'xartists-reticle-pulse 0.8s ease-in-out infinite' }}
          />
        ))}
      </svg>
      <style>{`
        @keyframes xartists-reticle-pulse {
          0%, 100% { opacity: 0.7; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-2px); }
        }
      `}</style>
    </div>
  )
}
