/**
 * Musée WebGL Live — FPS + avatar, dual-touch, fullscreen, prev/next artwork.
 * Graphite / acid-green chrome overlays. Immersive pass: teleport to art, orient.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import * as THREE from 'three'
import { useI18n } from '../../i18n/I18nContext'
import {
  createPlayerAvatar,
  tickAvatarWalk,
  loadAvatarSkin,
  AVATAR_SKINS,
  type AvatarSkinId,
} from '../../lib/museumAvatar'
import { type FrameItem } from './MuseumCorridor'
import ArtworkDetailsModal from './ArtworkDetailsModal'
import VirtualJoystick from './VirtualJoystick'
import type { RoomBlueprint, WallSeg } from '../../lib/roomBlueprint'
import { pointInBlueprintFloor } from '../../lib/loadBlueprint'
import { canListBuyNft } from '../../config/scStatus'
import { useWallet } from '../../context/WalletContext'
import { requestOpenConnect } from '../../lib/walletEvents'
import {
  trySlideMove,
  integrateWishVelocity,
  makeWalkableChecker,
} from '../../lib/spatialEngine'
import { MUSEUM_FPS, applyNavKey, isNavKey } from '../../lib/museumFpsController'
import NavReticle from './NavReticle'

const EYE = 1.65
const WALK = MUSEUM_FPS.walkSpeed
const SPRINT = MUSEUM_FPS.sprintSpeed
const MAX_ART = 24
const PITCH_MAX = MUSEUM_FPS.pitchMax
const CAM_DIST_AVATAR = MUSEUM_FPS.camMaxDist
const CAM_HEIGHT_AVATAR = 2.2
const STAND_DIST = 2.35

const AMBIENT_INTENSITY = 0.85
const KEY_INTENSITY = 1.5
const FILL_INTENSITY = 0.6
const RIM_INTENSITY = 0.5

type Theme = 'cyber' | 'stone' | 'gold' | 'white' | 'dark'
type ViewMode = 'fps' | 'avatar'

type ArtAnchor = {
  pos: THREE.Vector3
  nx: number
  nz: number
  frame: FrameItem
}

const PALETTE: Record<
  Theme,
  { wall: number; floor: number; ceil: number; fog: number; frame: number; emissive: number }
> = {
  cyber: { wall: 0x1e2440, floor: 0x0c1020, ceil: 0x141a30, fog: 0x0a0e1c, frame: 0x334155, emissive: 0xcdf58b },
  stone: { wall: 0x4a4038, floor: 0x242018, ceil: 0x3a3228, fog: 0x1a1610, frame: 0x6b5a48, emissive: 0xc4a574 },
  gold: { wall: 0x4a3c20, floor: 0x221c10, ceil: 0x3a2e18, fog: 0x18140c, frame: 0x7a6530, emissive: 0xe0b84a },
  white: { wall: 0xf0ebe3, floor: 0xd4cdc2, ceil: 0xfaf7f2, fog: 0xc8c0b4, frame: 0xe0d8cc, emissive: 0xa09888 },
  dark: { wall: 0x242018, floor: 0x12100c, ceil: 0x1a1814, fog: 0x0c0a08, frame: 0x3a3228, emissive: 0xcdf58b },
}

function wallGeom(w: WallSeg) {
  const dx = w.x2 - w.x1
  const dy = w.y2 - w.y1
  const len = Math.hypot(dx, dy) || 0.01
  return { len, angle: Math.atan2(dy, dx), mx: (w.x1 + w.x2) / 2, my: (w.y1 + w.y2) / 2, h: w.height || 3.5 }
}

function bounds(bp: RoomBlueprint) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const w of bp.walls) {
    minX = Math.min(minX, w.x1, w.x2)
    minY = Math.min(minY, w.y1, w.y2)
    maxX = Math.max(maxX, w.x1, w.x2)
    maxY = Math.max(maxY, w.y1, w.y2)
  }
  return { minX, minY, maxX, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 }
}

function titlePlaceholder(title: string): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 320
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#161914'
  ctx.fillRect(0, 0, 256, 320)
  ctx.strokeStyle = '#cdf58b'
  ctx.lineWidth = 4
  ctx.strokeRect(8, 8, 240, 304)
  ctx.fillStyle = '#f2f5ee'
  ctx.font = 'bold 16px system-ui'
  ctx.textAlign = 'center'
  ctx.fillText((title || 'Oeuvre').slice(0, 22), 128, 160)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

export default function MuseumWebGLHallLive({
  blueprint,
  frames,
  room = 'stone',
  allowBuy = true,
}: {
  blueprint: RoomBlueprint
  frames: FrameItem[]
  room?: Theme
  allowBuy?: boolean
  emptyLabel?: string
}) {
  const mountRef = useRef<HTMLDivElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const keys = useRef<Record<string, boolean>>({})
  const hold = useRef({ up: false, down: false, left: false, right: false })
  const nearestRef = useRef<FrameItem | null>(null)
  const viewModeRef = useRef<ViewMode>('fps')
  const spawnRef = useRef({ x: 0, z: 0, yaw: 0 })
  const resetReq = useRef(false)
  const teleportReq = useRef<number | null>(null)
  const artAnchorsRef = useRef<ArtAnchor[]>([])

  const [ready, setReady] = useState(false)
  const [nearTitle, setNearTitle] = useState('')
  const [avatarSkin] = useState<AvatarSkinId>(() => loadAvatarSkin())
  const [inspect, setInspect] = useState<FrameItem | null>(null)
  const [isCoarse, setIsCoarse] = useState(false)
  const [open, setOpen] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('fps')
  const [fullscreen, setFullscreen] = useState(false)
  const [artIndex, setArtIndex] = useState(0)

  const { t, lang } = useI18n()
  const { connected } = useWallet()
  const marketLive = canListBuyNft()
  const pal = PALETTE[room] || PALETTE.stone
  const isFr = lang === 'fr'

  const paintings = useMemo(() => {
    const list = frames.filter(f => !!f.image && f.kind !== 'sculpture').slice(0, MAX_ART)
    return list.map((f, i) => ({
      ...f,
      id: f.id && f.id !== 'default' ? f.id : `art-${i}-${(f.title || 'oeuvre').slice(0, 24)}`,
    }))
  }, [frames])

  useEffect(() => {
    viewModeRef.current = viewMode
  }, [viewMode])

  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const apply = () => setIsCoarse(!!mq.matches)
    apply()
    mq.addEventListener?.('change', apply)
    return () => mq.removeEventListener?.('change', apply)
  }, [])

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const el = shellRef.current
    if (!el) return
    try {
      if (!document.fullscreenElement) await el.requestFullscreen?.()
      else await document.exitFullscreen?.()
    } catch {
      /* */
    }
  }, [])

  tail = open('/home/workdir/artifacts/MuseumWebGLHallLive.tsx').read().split('const goArt')[1]
print('THIS IS WRONG APPROACH')
