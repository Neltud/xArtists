/**
 * Lottie léger — lazy + reduced-motion safe.
 * Animations embarquées (pas de réseau) pour packs / empty / success.
 */
import { lazy, Suspense, useMemo, type CSSProperties } from 'react'

const Lottie = lazy(() => import('lottie-react'))

/** Minimal spark / pulse JSON (violet-cyan xArtists) */
const SPARK = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 45,
  w: 120,
  h: 120,
  nm: 'spark',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'ring',
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [0] }, { t: 12, s: [100] }, { t: 40, s: [0] }] },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [60, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [40, 40, 100] },
            { t: 22, s: [110, 110, 100] },
            { t: 45, s: [130, 130, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'el',
          p: { a: 0, k: [0, 0] },
          s: { a: 0, k: [48, 48] },
        },
        {
          ty: 'st',
          c: { a: 0, k: [0.545, 0.361, 0.965, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 4 },
          lc: 2,
          lj: 2,
        },
        { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
      ],
      ip: 0,
      op: 45,
      st: 0,
      bm: 0,
    },
  ],
} as const

const CHECK = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 36,
  w: 120,
  h: 120,
  nm: 'check',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'tick',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [60, 60, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [0, 0, 100] },
            { t: 10, s: [110, 110, 100] },
            { t: 18, s: [100, 100, 100] },
          ],
        },
      },
      shapes: [
        {
          ty: 'sh',
          ks: {
            a: 0,
            k: {
              i: [
                [0, 0],
                [0, 0],
                [0, 0],
              ],
              o: [
                [0, 0],
                [0, 0],
                [0, 0],
              ],
              v: [
                [-22, 2],
                [-8, 16],
                [22, -14],
              ],
              c: false,
            },
          },
        },
        {
          ty: 'st',
          c: { a: 0, k: [0.133, 0.827, 0.933, 1] },
          o: { a: 0, k: 100 },
          w: { a: 0, k: 6 },
          lc: 2,
          lj: 2,
        },
        { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
      ],
      ip: 0,
      op: 36,
      st: 0,
      bm: 0,
    },
  ],
} as const

const PRESETS = {
  spark: SPARK,
  check: CHECK,
} as const

export type LottiePreset = keyof typeof PRESETS

export default function LottieIcon({
  preset = 'spark',
  loop = true,
  className = '',
  size = 48,
  style,
}: {
  preset?: LottiePreset
  loop?: boolean
  className?: string
  size?: number
  style?: CSSProperties
}) {
  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const data = useMemo(() => PRESETS[preset], [preset])

  if (reduce) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-violet-500/20 text-violet-200 ${className}`}
        style={{ width: size, height: size, ...style }}
        aria-hidden
      >
        {preset === 'check' ? '✓' : '✦'}
      </span>
    )
  }

  return (
    <Suspense
      fallback={
        <span
          className={`inline-block rounded-full bg-white/5 ${className}`}
          style={{ width: size, height: size }}
          aria-hidden
        />
      }
    >
      <Lottie
        animationData={data}
        loop={loop}
        className={className}
        style={{ width: size, height: size, ...style }}
      />
    </Suspense>
  )
}
