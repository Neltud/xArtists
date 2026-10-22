import {localizeChild as xaLocalize, renderChild as xaRender} from '../../i18n/phraseRuntime'
/**
 * Musee WebGL Live — placeArt textures, click-to-enlarge modal, drag look, joystick.
 * Bright gallery, first-person touch navigation and voluntary full screen.
 */
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
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
import MuseumStagePortal from './MuseumStagePortal'
import { loadTextureWithFallback } from '../../lib/loadTextureWithFallback'
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
import {viewMovement,isTapMovement} from '../../lib/museumNavigation'
import {clampCameraDistance} from '../../lib/spatialEngine'
import {useCopy} from '../../experience/state'
import Icon from '../../experience/Icon'
import MuseumBlueprintRoom from './MuseumBlueprintRoom'

const EYE = 1.65
const WALK = MUSEUM_FPS.walkSpeed
const SPRINT = MUSEUM_FPS.sprintSpeed
const MAX_ART = 24
const PITCH_MAX = MUSEUM_FPS.pitchMax
const CAM_DIST = MUSEUM_FPS.camMaxDist

/** Gallery lighting keeps both the room and artwork readable on mobile. */
const AMBIENT_INTENSITY = 1.15
const KEY_INTENSITY = 2.3
const FILL_INTENSITY = 1.1
const RIM_INTENSITY = 1.2

type Theme = 'cyber' | 'stone' | 'gold' | 'white' | 'dark'

const PALETTE: Record<
  Theme,
  { wall: number; floor: number; ceil: number; fog: number; frame: number; emissive: number }
> = {
  cyber: { wall: 0xb5bdac, floor: 0x68705f, ceil: 0xe5e9dc, fog: 0xd9dfd0, frame: 0x30372c, emissive: 0xcdf58b },
  stone: { wall: 0xc2b9a8, floor: 0x8e8776, ceil: 0xe7e2d4, fog: 0xc5bfae, frame: 0x544c3e, emissive: 0xc4a574 },
  gold: { wall: 0xcabc97, floor: 0x9b8b69, ceil: 0xece2c9, fog: 0xd3c8ac, frame: 0x7a6530, emissive: 0xe0b84a },
  white: { wall: 0xf0ebe3, floor: 0xd4cdc2, ceil: 0xfaf7f2, fog: 0xc8c0b4, frame: 0xe0d8cc, emissive: 0xa09888 },
  dark: { wall: 0x242018, floor: 0x12100c, ceil: 0x1a1814, fog: 0x0c0a08, frame: 0x3a3228, emissive: 0x5a544c },
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
  ctx.fillStyle = '#1a1620'
  ctx.fillRect(0, 0, 256, 320)
  ctx.strokeStyle = '#a78bfa'
  ctx.lineWidth = 4
  ctx.strokeRect(8, 8, 240, 304)
  ctx.fillStyle = '#e4e4e7'
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
  roomTitle = 'xArtists',
}: {
  blueprint: RoomBlueprint
  frames: FrameItem[]
  room?: Theme
  allowBuy?: boolean
  emptyLabel?: string
  roomTitle?: string
}) {
  const mountRef = useRef<HTMLDivElement>(null)
  const axes=useRef({x:0,y:0})
  const view=useRef<'first'|'third'>('first')
  const paused=useRef(false)
  const resetPosition=useRef<()=>void>(()=>{})
  const stepArt=useRef<(direction:number)=>void>(()=>{})
  const keys = useRef<Record<string, boolean>>({})
  const hold = useRef({ up: false, down: false, left: false, right: false })
  const nearestRef = useRef<FrameItem | null>(null)
  const [ready, setReady] = useState(false)
  const [nearTitle, setNearTitle] = useState('')
  const [avatarSkin] = useState<AvatarSkinId>(() => loadAvatarSkin())
  const [inspect, setInspect] = useState<FrameItem | null>(null)
  const [isCoarse, setIsCoarse] = useState(false)
  const [fullscreen,setFullscreen]=useState(false)
  const [viewMode,setViewMode]=useState<'first'|'third'>('first')
  const [sceneError,setSceneError]=useState(false)
  const [showHelp,setShowHelp]=useState(false)
  const [imageFailures,setImageFailures]=useState(0)
  const c=useCopy()
  useEffect(()=>{view.current=viewMode},[viewMode])
  useEffect(()=>{paused.current=!!inspect;if(inspect){axes.current={x:0,y:0};keys.current={};hold.current={up:false,down:false,left:false,right:false}}},[inspect])
  useEffect(()=>{if(!fullscreen)return;const old=document.body.style.overflow;document.body.style.overflow='hidden';const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setFullscreen(false)};window.addEventListener('keydown',key);return()=>{document.body.style.overflow=old;window.removeEventListener('keydown',key)}},[fullscreen])
  const { t } = useI18n()
  const { connected } = useWallet()
  const marketLive = canListBuyNft()
  const pal = PALETTE[room] || PALETTE.stone
  const paintings = useMemo(() => {
    const list = frames.filter(f => !!f.image && f.kind !== 'sculpture').slice(0, MAX_ART)
    return list.map((f, i) => ({
      ...f,
      id: f.id && f.id !== 'default' ? f.id : `art-${i}-${(f.title || 'oeuvre').slice(0, 24)}`,
    }))
  }, [frames])

  useEffect(() => {
    const mq = window.matchMedia('(any-pointer: coarse)')
    const apply = () => setIsCoarse(!!mq.matches)
    apply()
    mq.addEventListener?.('change', apply)
    return () => mq.removeEventListener?.('change', apply)
  }, [])

  const onBuy = useCallback(
    async (frame: FrameItem) => {
      if (!connected) {
        requestOpenConnect()
        return
      }
      window.dispatchEvent(
        new CustomEvent('lia-intent', {
          detail: {
            lip: {
              raw: `acheter NFT ${frame.id}`,
              type: 'BUY_NFT',
              asset_id: frame.id,
              paper: !marketLive,
              collection: frame.collection,
              title: frame.title,
            },
          },
        }),
      )
    },
    [connected, marketLive],
  )

  useEffect(() => {
    const mount = mountRef.current
    if (!mount||sceneError) return
    setReady(false);setImageFailures(0)
    let disposed = false
    let webglPaused = false
    let vx = 0
    let vz = 0
    let walkPhase = 0
    let lastNearTitle = ''
    const b = bounds(blueprint)
    const wallH = blueprint.wallHeight || 3.8
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(pal.fog)
    scene.fog = new THREE.FogExp2(pal.fog, 0.006)
    const camera = new THREE.PerspectiveCamera(68, 1, 0.08, 90)
    const coarse = window.matchMedia('(pointer: coarse)').matches
    const lowMem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
    const lowEnd = coarse || (typeof lowMem === 'number' && lowMem > 0 && lowMem <= 4)
    let renderer:THREE.WebGLRenderer
    try{renderer = new THREE.WebGLRenderer({
      antialias: !lowEnd,
      powerPreference: lowEnd ? 'low-power' : 'high-performance',
      failIfMajorPerformanceCaveat: false,
    })}catch{setSceneError(true);return}
    renderer.setPixelRatio(Math.min(devicePixelRatio, lowEnd ? 1.25 : 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.22
    mount.appendChild(renderer.domElement)
    const canvas = renderer.domElement
    canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;pointer-events:auto'
    canvas.tabIndex=0
    canvas.setAttribute('aria-label',roomTitle)

    const onVisibility = () => {
      webglPaused = document.visibilityState !== 'visible'
    }
    document.addEventListener('visibilitychange', onVisibility)
    onVisibility()

    const onContextLost = (e: Event) => {
      e.preventDefault()
      webglPaused = true
      try {
        setSceneError(true)
      } catch {
        /* */
      }
    }
    canvas.addEventListener('webglcontextlost', onContextLost, false)

    const floorMat = new THREE.MeshStandardMaterial({ color: pal.floor, roughness: 0.85, metalness: 0.06 })
    const wallMat = new THREE.MeshStandardMaterial({ color: pal.wall, roughness: 0.9, metalness: 0.04 })
    const ceilMat = new THREE.MeshStandardMaterial({ color: pal.ceil, roughness: 1, metalness: 0 })
    const floorW = Math.max(4, b.maxX - b.minX + 2)
    const floorD = Math.max(4, b.maxY - b.minY + 2)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(floorW, floorD), floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.set(b.cx, 0, b.cy)
    floor.frustumCulled = true
    scene.add(floor)
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(floorW, floorD), ceilMat)
    ceil.rotation.x = Math.PI / 2
    ceil.position.set(b.cx, wallH, b.cy)
    ceil.frustumCulled = true
    scene.add(ceil)

    for (const w of blueprint.walls) {
      const g = wallGeom(w)
      const thick = Math.max(0.26, w.thickness || 0.26)
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(g.len, g.h, thick), wallMat)
      mesh.position.set(g.mx, g.h / 2, g.my)
      mesh.rotation.y = -g.angle
      mesh.frustumCulled = true
      scene.add(mesh)
    }

    scene.add(new THREE.AmbientLight(0xffffff, AMBIENT_INTENSITY))
    scene.add(new THREE.HemisphereLight(0xf5fff0,0x7f8974,1.7))
    const seams=new THREE.GridHelper(Math.max(floorW,floorD),Math.max(6,Math.round(Math.max(floorW,floorD)/2)),0x6a735e,0x858d7a);seams.position.set(b.cx,.008,b.cy);(seams.material as THREE.Material).transparent=true;(seams.material as THREE.Material).opacity=.15;scene.add(seams)
    const stripMat=new THREE.MeshBasicMaterial({color:0xfffff3});for(let i=0;i<3;i++){const strip=new THREE.Mesh(new THREE.BoxGeometry(Math.min(floorW*.68,20),.035,.15),stripMat);strip.position.set(b.cx,wallH-.05,b.cy+(i-1)*Math.min(4,floorD*.25));scene.add(strip)}
    const key = new THREE.DirectionalLight(0xfff5e6, KEY_INTENSITY)
    key.position.set(b.cx + 3, wallH - 0.4, b.cy - 2)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xb8c5ff, FILL_INTENSITY)
    fill.position.set(b.cx - 4, wallH * 0.6, b.cy + 3)
    scene.add(fill)
    const rim = new THREE.PointLight(0xffd9a0, RIM_INTENSITY, 20)
    rim.position.set(b.cx, wallH - 0.5, b.cy)
    scene.add(rim)

    const skin0 = loadAvatarSkin()
    const accent0 = AVATAR_SKINS.find(s => s.id === skin0)?.accent ?? 0x8b5cf6
    const avatar = createPlayerAvatar(skin0, accent0)
    scene.add(avatar)

    const loader = new THREE.TextureLoader()
    loader.crossOrigin = 'anonymous'
    const artAnchors: { pos: THREE.Vector3; frame: FrameItem }[] = []
    const pickMeshes: THREE.Object3D[] = []
    const wallList = blueprint.walls.filter(w => Math.hypot(w.x2 - w.x1, w.y2 - w.y1) > 1.2)

    function placeArt(
      tex: THREE.Texture,
      apx: number,
      apz: number,
      nx: number,
      nz: number,
      frame: FrameItem,
    ) {
      if (disposed) { tex.dispose(); return }
      tex.colorSpace = THREE.SRGBColorSpace
      const art = new THREE.Mesh(
        new THREE.PlaneGeometry(1.25, 1.5),
        new THREE.MeshBasicMaterial({map:tex,toneMapped:false,side:THREE.DoubleSide}),
      )
      art.position.set(apx + nx * 0.08, 1.65, apz + nz * 0.08)
      const img=tex.image as {width?:number;height?:number}|undefined
      const ratio=(img?.width||1)/(img?.height||1)
      art.scale.set(Math.min(1,ratio*1.5/1.25),Math.min(1,1.25/ratio/1.5),1)
      art.rotation.y = Math.atan2(nx,nz)
      art.userData.frame = frame
      art.frustumCulled = true
      scene.add(art)
      pickMeshes.push(art)
    }

    const nWalls = Math.max(1, wallList.length)
    paintings.forEach((frame, i) => {
      const w = wallList[i % nWalls]
      if (!w) return
      const g = wallGeom(w)
      const onThis = Math.floor(i / nWalls)
      const totalOn = Math.ceil(paintings.length / nWalls)
      const t = 0.18 + ((onThis + 0.5) / Math.max(1, totalOn)) * 0.64
      const ax = w.x1 + (w.x2 - w.x1) * t
      const az = w.y1 + (w.y2 - w.y1) * t
      let nx = -Math.sin(g.angle),nz = Math.cos(g.angle)
      if(!pointInBlueprintFloor(blueprint,ax+nx*.65,az+nz*.65)){nx=-nx;nz=-nz}
      const offset=Math.max(.26,w.thickness||.26)/2+.07
      const apx = ax + nx * offset
      const apz = az + nz * offset
      const frameMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.42, 1.7, 0.1),
        new THREE.MeshStandardMaterial({
          color: pal.frame,
          roughness: 0.4,
          metalness: 0.28,
          emissive: pal.emissive,
          emissiveIntensity: 0.03,
        }),
      )
      frameMesh.position.set(apx, 1.65, apz)
      frameMesh.rotation.y = Math.atan2(nx,nz)
      frameMesh.userData.frame = frame
      frameMesh.frustumCulled = true
      scene.add(frameMesh)
      pickMeshes.push(frameMesh)
      artAnchors.push({ pos: new THREE.Vector3(apx, 1.65, apz), frame })
      const url = frame.image || ''
      if (url) {
        loadTextureWithFallback(
          loader,
          url,
          tex => {if(disposed){tex.dispose();return}placeArt(tex, apx, apz, nx, nz, frame)},
          () => {if(!disposed){setImageFailures(n=>n+1);placeArt(titlePlaceholder(frame.title || 'Art'), apx, apz, nx, nz, frame)}},
          () => disposed,
        )
      } else {
        placeArt(titlePlaceholder(frame.title || 'Art'), apx, apz, nx, nz, frame)
      }
    })

    const isWalkable = makeWalkableChecker(
      blueprint.walls.map(w => ({
        x1: w.x1,
        y1: w.y1,
        x2: w.x2,
        y2: w.y2,
        thickness: w.thickness || 0.26,
      })),
      (x, z) => pointInBlueprintFloor(blueprint, x, z),
      MUSEUM_FPS.collisionRadius,
    )

    let px = b.cx
    let pz = b.cy
    if (!isWalkable(px, pz)) {
      px = b.minX + 1.8
      pz = b.minY + 1.8
    }
    let yaw = 0
    let pitch = 0.02
    let facing = 0,artIndex=0
    const resetInputs=()=>{axes.current={x:0,y:0};hold.current={up:false,down:false,left:false,right:false};keys.current={};vx=0;vz=0}
    const spawn={x:px,z:pz}
    resetPosition.current=()=>{resetInputs();px=spawn.x;pz=spawn.z;yaw=0;pitch=.08}
    stepArt.current=(direction)=>{if(!artAnchors.length)return;resetInputs();artIndex=(artIndex+direction+artAnchors.length)%artAnchors.length;const target=artAnchors[artIndex];const dx=b.cx-target.pos.x,dz=b.cy-target.pos.z,len=Math.hypot(dx,dz)||1;for(const d of [2.4,1.8,1.2,3.2]){const x=target.pos.x+dx/len*d,z=target.pos.z+dz/len*d;if(isWalkable(x,z)){px=x;pz=z;break}}yaw=Math.atan2(px-target.pos.x,pz-target.pos.z);pitch=0}
    window.addEventListener('blur',resetInputs)
    const clearOnHide=()=>{if(document.hidden)resetInputs()};document.addEventListener('visibilitychange',clearOnHide)
    avatar.position.set(px, 0, pz)

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth || 1
      const h = mount.clientHeight || 1
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    })
    ro.observe(mount)
    renderer.setSize(mount.clientWidth || 640, mount.clientHeight || 400, false)

    const kd = (e: KeyboardEvent) => {
      const tag=(e.target as HTMLElement)?.tagName
      if(paused.current||!mount.contains(document.activeElement)||['INPUT','TEXTAREA','SELECT','BUTTON'].includes(tag))return
      if (isNavKey(e)) {
        e.preventDefault()
        applyNavKey(keys.current, e, true)
      }
      const k = e.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'shift', 'e'].includes(k)) {
        keys.current[k] = true
        if (k === 'e' && nearestRef.current) setInspect(nearestRef.current)
      }
    }
    const ku = (e: KeyboardEvent) => {
      if (isNavKey(e)) applyNavKey(keys.current, e, false)
      const k = e.key.toLowerCase()
      if (['w', 'a', 's', 'd', 'shift', 'e'].includes(k)) keys.current[k] = false
    }
    window.addEventListener('keydown', kd, { passive: false })
    window.addEventListener('keyup', ku, { passive: false })

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let dragPointer:number|null=null,startX=0,startY=0
    let lastX = 0
    let lastY = 0
    let moved = false

    const onPointerDown = (e: PointerEvent) => {
      if(paused.current||dragPointer!==null)return
      canvas.focus({preventScroll:true})
      e.preventDefault();dragPointer=e.pointerId;startX=e.clientX;startY=e.clientY
      moved = false
      lastX = e.clientX
      lastY = e.clientY
      try {
        canvas.setPointerCapture(e.pointerId)
      } catch {
        /* */
      }
    }
    const onPointerMove = (e: PointerEvent) => {
      if(e.pointerId!==dragPointer||paused.current)return
      e.preventDefault()
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      if(!isTapMovement(startX,startY,e.clientX,e.clientY))moved=true
      lastX = e.clientX
      lastY = e.clientY
      yaw -= dx * 0.005
      pitch = Math.max(-PITCH_MAX, Math.min(PITCH_MAX, pitch - dy * 0.003))
    }
    const onPointerUp = (e: PointerEvent) => {
      if(e.pointerId!==dragPointer)return
      dragPointer=null
      try {
        canvas.releasePointerCapture(e.pointerId)
      } catch {
        /* */
      }
      if (moved) return
      const rect = canvas.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(pickMeshes, false)
      if (hits.length > 0) {
        const f = hits[0].object.userData.frame as FrameItem | undefined
        if (f) setInspect(f)
      } else if (nearestRef.current) {
        setInspect(nearestRef.current)
      }
    }
    const onPointerCancel=(e:PointerEvent)=>{if(e.pointerId===dragPointer){dragPointer=null;moved=true}}
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel',onPointerCancel)
    canvas.addEventListener('lostpointercapture',onPointerCancel)

    setReady(true)
    const clock = new THREE.Clock()
    let raf = 0
    const loop = () => {
      if (disposed) return
      raf = requestAnimationFrame(loop)
      if(webglPaused||paused.current||document.body.classList.contains('webgl-paused')){clock.getDelta();return}
      const dt = Math.min(clock.getDelta(), 0.05)
      const sprint = !!keys.current.shift
      const speed = sprint ? SPRINT : WALK
      let ix = 0
      let iz = 0
      if (keys.current.w || (!coarse&&hold.current.up)) iz -= 1
      if (keys.current.s || (!coarse&&hold.current.down)) iz += 1
      if (keys.current.a || (!coarse&&hold.current.left)) ix -= 1
      if (keys.current.d || (!coarse&&hold.current.right)) ix += 1
      const len = Math.hypot(ix, iz) || 1
      ix /= len
      iz /= len
      const touch=axes.current
      const direction=viewMovement(ix+(coarse?touch.x:0),iz+(coarse?touch.y:0),yaw)
      const wishX=direction.x,wishZ=direction.z
      const moving = Math.hypot(wishX,wishZ) > 0.01
      const integ = integrateWishVelocity(
        vx,
        vz,
        wishX,
        wishZ,
        speed,
        dt,
        moving,
        MUSEUM_FPS.accel,
        MUSEUM_FPS.friction,
      )
      vx = integ.vx
      vz = integ.vz
      if (moving) facing = Math.atan2(wishX, wishZ)
      const slide = trySlideMove(px, pz, vx, vz, dt, isWalkable, MUSEUM_FPS.collisionRadius)
      px = slide.x
      pz = slide.z
      vx = slide.vx
      vz = slide.vz
      avatar.position.set(px, 0, pz)
      avatar.rotation.y = facing
      walkPhase = tickAvatarWalk(avatar, walkPhase, Math.min(1, Math.hypot(vx, vz) / WALK), dt)

      let nearest: FrameItem | null = null
      let best = 4.2
      for (const a of artAnchors) {
        const d = Math.hypot(a.pos.x - px, a.pos.z - pz)
        if (d < best) {
          best = d
          nearest = a.frame
        }
      }
      nearestRef.current = nearest
      if (nearest && nearest.title !== lastNearTitle) {
        lastNearTitle = nearest.title
        setNearTitle(nearest.title)
      } else if (!nearest && lastNearTitle) {
        lastNearTitle = ''
        setNearTitle('')
      }

      avatar.visible=view.current==='third'
      const distance=view.current==='third'?clampCameraDistance(px,pz,yaw+Math.PI,0,Math.min(CAM_DIST,3),isWalkable,0):0
      camera.position.set(px+Math.sin(yaw)*distance,EYE+(distance?Math.sin(pitch)*.5:.03),pz+Math.cos(yaw)*distance)
      camera.lookAt(px-Math.sin(yaw)*4,EYE+Math.sin(pitch)*4,pz-Math.cos(yaw)*4)
      mount.dataset.moving=moving?'1':'0'

      renderer.render(scene, camera)
    }
    loop()

    return () => {
      disposed = true
      webglPaused = true
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
      canvas.removeEventListener('webglcontextlost', onContextLost)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel',onPointerCancel)
      canvas.removeEventListener('lostpointercapture',onPointerCancel)
      window.removeEventListener('blur',resetInputs)
      document.removeEventListener('visibilitychange',clearOnHide)
      resetInputs()
      ro.disconnect()
      try {
        scene.traverse(obj => {
          const mesh = obj as THREE.Mesh
          if (mesh.geometry) mesh.geometry.dispose()
          const mat = mesh.material
          if (mat) {
            const list = Array.isArray(mat) ? mat : [mat]
            list.forEach(m => {
              const std = m as THREE.MeshStandardMaterial
              if (std.map) std.map.dispose()
              m.dispose()
            })
          }
        })
        renderer.dispose()
      } catch {
        /* */
      }
      if (mount.contains(canvas)) mount.removeChild(canvas)
    }
  }, [blueprint, paintings, pal, avatarSkin, sceneError])

  if(sceneError)return <div className="xa-museum-fallback"><p>{c('museumFallback')}</p><MuseumBlueprintRoom blueprint={blueprint} frames={frames} room={room} allowBuy={allowBuy}/><button type="button" className="xa-button secondary" onClick={()=>setSceneError(false)}>{c('refresh')}</button></div>
  return <MuseumStagePortal fullscreen={fullscreen}><div className={`xa-museum-stage ${fullscreen?'is-fullscreen':''}`} aria-label={roomTitle}>
    <div ref={mountRef} className="xa-museum-canvas"/>
    {!ready&&<div className="xa-museum-loading" role="status"><span className="xa-loader"/>{c('museumLoading')}</div>}
    <div className="xa-museum-hud"><div className="xa-museum-room-name"><span className="xa-eyebrow">xArtists / {c('view3d')}</span><strong>{roomTitle}</strong><span>{paintings.length} {c('museumWorks')}</span></div><div className="xa-museum-hud-actions"><button type="button" title={c('museumView')} aria-label={c('museumView')} onClick={()=>setViewMode(v=>v==='first'?'third':'first')}><Icon name="user" size={17}/><span>{c(viewMode==='first'?'museumFirst':'museumThird')}</span></button><button type="button" title={c('museumReset')} aria-label={c('museumReset')} onClick={()=>resetPosition.current()}><Icon name="refresh" size={17}/></button><button type="button" aria-label={c('help')} title={c('help')} aria-expanded={showHelp} onClick={()=>setShowHelp(v=>!v)}><Icon name="book" size={17}/></button><button type="button" className="xa-museum-fullscreen" aria-label={c(fullscreen?'museumExit':'museumFullscreen')} title={c(fullscreen?'museumExit':'museumFullscreen')} onClick={()=>setFullscreen(v=>!v)}><Icon name={fullscreen?'close':'diagonal'} size={19}/><span>{c(fullscreen?'museumExit':'museumFullscreen')}</span></button></div></div>
    {showHelp&&<div className="xa-museum-help"><p>{c(isCoarse?'museumTouchHelp':'museumKeyboardHelp')}</p><button type="button" onClick={()=>setShowHelp(false)} aria-label={c('close')}><Icon name="close" size={16}/></button></div>}
    <div className="xa-museum-art-tour"><button type="button" aria-label={c('museumPrevious')} onClick={()=>stepArt.current(-1)}><Icon name="chevron" className="xa-flip" size={17}/></button><span>{c('museumTour')}</span><button type="button" aria-label={c('museumNext')} onClick={()=>stepArt.current(1)}><Icon name="chevron" size={17}/></button></div>
    {isCoarse&&<><VirtualJoystick hold={hold} axes={axes}/><div className="xa-museum-look-hint" aria-hidden="true"><Icon name="globe" size={25}/><span>{c('museumLook')}</span></div></>}
    <NavReticle movingRef={mountRef}/>
    <div className="xa-museum-bottom-hud">{nearTitle?<button type="button" className="xa-museum-inspect" onClick={()=>{if(nearestRef.current)setInspect(nearestRef.current)}}><span>{nearTitle}</span><Icon name="diagonal" size={16}/>{c('museumInspect')}</button>:<span className="xa-museum-walk-hint">{c(isCoarse?'museumTouchHint':'museumKeyboardHint')}</span>}</div>
    {imageFailures>0&&<div className="xa-museum-image-status" role="status">{c('museumImageError')}</div>}
    {inspect&&<ArtworkDetailsModal frame={inspect} onClose={()=>setInspect(null)} onBuy={allowBuy?()=>void onBuy(inspect):undefined}/>}
  </div></MuseumStagePortal>
}
