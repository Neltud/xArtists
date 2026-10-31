/**
 * Carte Genesis 3D — recto peinture (œuvre) · verso HUD (metadata).
 * Rotation Y continue (pause au hover / focus). prefers-reduced-motion = face fixe.
 */
import { useId, useState } from 'react'
import { PACK_EDITION, PACK_VISUAL, type PackId } from '../../config/agentPacks'

type Props = {
  id: PackId
  /** Auto-spin; default true */
  autoRotate?: boolean
  className?: string
  /** Sample edition number for HUD demo (1-based) */
  sampleEdition?: number
}

const FACE_LAYERS: Record<
  PackId,
  { base: string; veil: string; stroke: string; core: string }
> = {
  pulse: {
    base: 'linear-gradient(158deg, #0c1008 0%, #1a2212 42%, #080a06 100%)',
    veil: 'radial-gradient(ellipse 85% 70% at 35% 28%, rgba(232,245,168,.55), transparent 58%)',
    stroke: 'radial-gradient(circle at 70% 72%, rgba(205,245,139,.28), transparent 48%)',
    core: 'radial-gradient(circle, rgba(232,245,168,.95) 0%, rgba(180,210,100,.35) 35%, transparent 68%)',
  },
  yield: {
    base: 'linear-gradient(165deg, #0b0c0b 0%, #161816 45%, #090a09 100%)',
    veil: 'radial-gradient(ellipse 75% 60% at 62% 30%, rgba(200,204,196,.42), transparent 55%)',
    stroke: 'radial-gradient(circle at 28% 68%, rgba(180,184,176,.22), transparent 50%)',
    core: 'radial-gradient(circle, rgba(220,224,216,.7) 0%, rgba(160,164,156,.25) 40%, transparent 70%)',
  },
  sentinel: {
    base: 'linear-gradient(150deg, #0a0810 0%, #14101a 40%, #07060c 100%)',
    veil: 'radial-gradient(ellipse 80% 70% at 50% 78%, rgba(167,139,250,.45), transparent 55%)',
    stroke: 'radial-gradient(circle at 24% 26%, rgba(196,181,253,.25), transparent 46%)',
    core: 'radial-gradient(circle, rgba(196,181,253,.85) 0%, rgba(120,90,200,.3) 38%, transparent 68%)',
  },
}

const NOISE =
  'url("data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.85%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27 opacity=%270.5%27/%3E%3C/svg%3E")'

export default function GenesisCard3D({
  id,
  autoRotate = true,
  className = '',
  sampleEdition = 47,
}: Props) {
  const v = PACK_VISUAL[id]
  const ed = PACK_EDITION[id]
  const face = FACE_LAYERS[id]
  const uid = useId().replace(/:/g, '')
  const [paused, setPaused] = useState(false)
  const edition = Math.min(Math.max(1, sampleEdition), ed.maxSupply)
  const label = id === 'pulse' ? 'PULSE' : id === 'yield' ? 'YIELD' : 'SENTINEL'

  return (
    <div
      className={`xa-g3d-scene ${className}`}
      style={{ perspective: '1100px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      tabIndex={0}
      role="img"
      aria-label={`${label} Genesis card, face peinture, dos HUD, édition ${edition} sur ${ed.maxSupply}`}
    >
      <style>{`
        @keyframes xa-g3d-spin-${uid} {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
        .xa-g3d-card-${uid} {
          transform-style: preserve-3d;
          animation: xa-g3d-spin-${uid} 14s linear infinite;
          animation-play-state: ${paused || !autoRotate ? 'paused' : 'running'};
        }
        @media (prefers-reduced-motion: reduce) {
          .xa-g3d-card-${uid} { animation: none !important; transform: rotateY(0deg) !important; }
        }
        .xa-g3d-face-${uid} {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .xa-g3d-back-${uid} {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transform: rotateY(180deg);
        }
      `}</style>

      <div
        className={`xa-g3d-card-${uid} relative aspect-[3/4] w-full`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* RECTO — peinture */}
        <div
          className={`xa-g3d-face-${uid} absolute inset-0 overflow-hidden rounded-2xl border`}
          style={{
            borderColor: v.border,
            boxShadow: v.glow,
            background: face.base,
          }}
        >
          <div className="absolute inset-0" style={{ background: face.veil }} />
          <div className="absolute inset-0" style={{ background: face.stroke }} />
          <div
            className="absolute inset-0 opacity-40 mix-blend-overlay"
            style={{ backgroundImage: NOISE }}
          />
          {/* soft brush-like veils */}
          <div
            className="absolute inset-[8%] rounded-full opacity-80 blur-[2px]"
            style={{ background: face.core }}
          />
          <div
            className="absolute left-[18%] top-[22%] h-[38%] w-[38%] rounded-[40%] opacity-50 blur-md"
            style={{ background: face.core }}
          />
          <div
            className="absolute right-[12%] bottom-[28%] h-[30%] w-[42%] rounded-[45%] opacity-35 blur-lg"
            style={{ background: face.veil }}
          />
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <p
              className="text-[10px] font-medium tracking-[0.28em] uppercase"
              style={{ color: v.accent }}
            >
              {label} · {v.badge}
            </p>
            <p className="mt-1 text-[9px] text-zinc-500">{v.mediaMotif}</p>
          </div>
        </div>

        {/* VERSO — HUD */}
        <div
          className={`xa-g3d-back-${uid} absolute inset-0 overflow-hidden rounded-2xl border bg-[#0a0b0a]`}
          style={{ borderColor: v.border, boxShadow: v.glow }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)',
              backgroundSize: '16px 16px',
            }}
          />
          <div className="relative z-[1] flex h-full flex-col gap-2 p-3 font-mono text-[9px] leading-tight">
            <div className="flex items-center justify-between text-zinc-500">
              <span>NFT_BACK</span>
              <span style={{ color: v.accent }}>v1</span>
            </div>
            <div className="h-px w-full" style={{ background: v.border }} />
            <HudRow k="PACK_ID" val={label} accent={v.accent} />
            <HudRow k="TIER" val={v.badge} accent={v.accent} />
            <HudRow
              k="EDITION"
              val={`#${String(edition).padStart(3, '0')}/${ed.maxSupply}`}
              accent={v.accent}
            />
            <HudRow k="BILLING" val="one_time" accent={v.accent} />
            <HudRow k="RIGHTS" val="durable" accent={v.accent} />
            <HudRow k="CHAIN" val="MultiversX SFT" accent={v.accent} />
            <HudRow k="STATUS" val="paper" accent={v.accent} />
            <div className="mt-auto space-y-1.5 pt-2">
              <div className="h-px w-full" style={{ background: v.border }} />
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">AUTH_HASH</span>
                <span className="tabular-nums text-zinc-500">····{edition.toString(16)}</span>
              </div>
              <div
                className="flex items-center justify-center gap-2 rounded-full border py-1.5 text-[10px] uppercase tracking-wider"
                style={{ borderColor: v.border, color: v.accent }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: v.accent, boxShadow: `0 0 8px ${v.accent}` }}
                />
                SYS_OK · Genesis
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function HudRow({ k, val, accent }: { k: string; val: string; accent: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-zinc-600">{k}</span>
      <span className="truncate tabular-nums font-medium" style={{ color: accent }}>
        {val}
      </span>
    </div>
  )
}
