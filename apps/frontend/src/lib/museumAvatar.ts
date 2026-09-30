/**
 * Playable museum avatars (3rd person) — human, creatures, Pikachu-style.
 */
import * as THREE from 'three'

export type AvatarSkinId =
  | 'human'
  | 'dragon'
  | 'eagle'
  | 'dragonfly'
  | 'fox'
  | 'pikachu'
  | 'eevee'

export const AVATAR_SKINS: { id: AvatarSkinId; label: string; accent: number }[] = [
  { id: 'human', label: 'Explorateur', accent: 0x8b5cf6 },
  { id: 'dragon', label: 'Dragon', accent: 0xef4444 },
  { id: 'eagle', label: 'Aigle', accent: 0xf59e0b },
  { id: 'dragonfly', label: 'Libellule', accent: 0x22d3ee },
  { id: 'fox', label: 'Renard', accent: 0xf97316 },
  { id: 'pikachu', label: 'Pikachu', accent: 0xfacc15 },
  { id: 'eevee', label: 'Évoli', accent: 0xc4a574 },
]

const STORAGE_KEY = 'xartists.museum.avatarSkin'

export function loadAvatarSkin(): AvatarSkinId {
  try {
    const v = localStorage.getItem(STORAGE_KEY) as AvatarSkinId | null
    if (v && AVATAR_SKINS.some(s => s.id === v)) return v
  } catch {
    /* */
  }
  return 'human'
}

export function saveAvatarSkin(id: AvatarSkinId) {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* */
  }
}

export function createPlayerAvatar(
  skinOrAccent: AvatarSkinId | number = 'human',
  accentOverride?: number,
): THREE.Group {
  let skin: AvatarSkinId = 'human'
  let accent = AVATAR_SKINS[0].accent
  if (typeof skinOrAccent === 'number') {
    accent = skinOrAccent
    skin = loadAvatarSkin()
  } else {
    skin = skinOrAccent
    accent = accentOverride ?? AVATAR_SKINS.find(s => s.id === skin)?.accent ?? accent
  }
  if (skin === 'dragon') return createDragon(accent)
  if (skin === 'eagle') return createEagle(accent)
  if (skin === 'dragonfly') return createDragonfly(accent)
  if (skin === 'fox') return createFox(accent)
  if (skin === 'pikachu') return createPikachu(accent)
  if (skin === 'eevee') return createEevee(accent)
  return createHuman(accent)
}

function createHuman(accent: number): THREE.Group {
  const root = new THREE.Group()
  root.name = 'playerAvatar'
  const skin = new THREE.MeshStandardMaterial({ color: 0xc4a574, roughness: 0.65, metalness: 0.05 })
  const cloth = new THREE.MeshStandardMaterial({
    color: accent,
    roughness: 0.45,
    metalness: 0.15,
    emissive: accent,
    emissiveIntensity: 0.12,
  })
  const dark = new THREE.MeshStandardMaterial({ color: 0x1e1b2e, roughness: 0.7, metalness: 0.1 })
  const legGeo = new THREE.CapsuleGeometry(0.11, 0.45, 4, 8)
  const legL = new THREE.Mesh(legGeo, dark)
  legL.position.set(-0.12, 0.35, 0)
  legL.name = 'legL'
  const legR = new THREE.Mesh(legGeo, dark)
  legR.position.set(0.12, 0.35, 0)
  legR.name = 'legR'
  root.add(legL, legR)
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.4, 6, 10), cloth)
  torso.position.y = 0.95
  root.add(torso)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 14), skin)
  head.position.y = 1.45
  root.add(head)
  const armGeo = new THREE.CapsuleGeometry(0.07, 0.32, 4, 8)
  const armL = new THREE.Mesh(armGeo, cloth)
  armL.position.set(-0.28, 1.05, 0)
  armL.name = 'armL'
  const armR = new THREE.Mesh(armGeo, cloth)
  armR.position.set(0.28, 1.05, 0)
  armR.name = 'armR'
  root.add(armL, armR)
  return root
}

function createDragon(accent: number): THREE.Group {
  const root = new THREE.Group()
  root.name = 'playerAvatar'
  const mat = new THREE.MeshStandardMaterial({
    color: accent,
    roughness: 0.4,
    metalness: 0.25,
    emissive: accent,
    emissiveIntensity: 0.15,
  })
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 0.5, 6, 10), mat)
  body.position.y = 0.8
  root.add(body)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), mat)
  head.position.set(0.25, 1.2, 0)
  root.add(head)
  const wingL = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 0.6, 4),
    new THREE.MeshStandardMaterial({ color: accent, transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
  )
  wingL.position.set(-0.3, 1.0, 0)
  wingL.rotation.z = 1.2
  wingL.name = 'armL'
  const wingR = wingL.clone()
  wingR.position.x = 0.3
  wingR.rotation.z = -1.2
  wingR.name = 'armR'
  root.add(wingL, wingR)
  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.3, 3, 6), mat)
  legL.position.set(-0.12, 0.3, 0)
  legL.name = 'legL'
  const legR = legL.clone()
  legR.position.x = 0.12
  legR.name = 'legR'
  root.add(legL, legR)
  return root
}

function createEagle(accent: number): THREE.Group {
  const root = new THREE.Group()
  root.name = 'playerAvatar'
  const mat = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.5, metalness: 0.1 })
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), mat)
  body.position.y = 0.9
  body.scale.set(1, 1.2, 0.9)
  root.add(body)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), mat)
  head.position.set(0.2, 1.15, 0)
  root.add(head)
  const wingL = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.3), mat)
  wingL.position.set(-0.35, 0.95, 0)
  wingL.name = 'armL'
  const wingR = wingL.clone()
  wingR.position.x = 0.35
  wingR.name = 'armR'
  root.add(wingL, wingR)
  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.25, 2, 4), mat)
  legL.position.set(-0.08, 0.45, 0)
  legL.name = 'legL'
  const legR = legL.clone()
  legR.position.x = 0.08
  legR.name = 'legR'
  root.add(legL, legR)
  return root
}

function createDragonfly(accent: number): THREE.Group {
  const root = new THREE.Group()
  root.name = 'playerAvatar'
  const mat = new THREE.MeshStandardMaterial({
    color: accent,
    roughness: 0.35,
    metalness: 0.3,
    emissive: accent,
    emissiveIntensity: 0.2,
  })
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.7, 4, 8), mat)
  body.position.y = 1.0
  root.add(body)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), mat)
  head.position.set(0, 1.4, 0)
  root.add(head)
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xa5f3fc,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
    emissive: 0x22d3ee,
    emissiveIntensity: 0.2,
  })
  const wingL = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.22), wingMat)
  wingL.position.set(0, 1.05, 0.15)
  wingL.name = 'armL'
  const wingR = wingL.clone()
  wingR.position.z = -0.15
  wingR.name = 'armR'
  root.add(wingL, wingR)
  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.02, 0.15, 2, 4), mat)
  legL.position.set(-0.1, 0.55, 0)
  legL.name = 'legL'
  const legR = legL.clone()
  legR.position.x = 0.1
  legR.name = 'legR'
  root.add(legL, legR)
  return root
}

function createFox(accent: number): THREE.Group {
  const root = new THREE.Group()
  root.name = 'playerAvatar'
  const mat = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.55, metalness: 0.08 })
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.4, 6, 8), mat)
  body.position.y = 0.75
  root.add(body)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), mat)
  head.position.set(0.15, 1.15, 0)
  root.add(head)
  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 4), mat)
  earL.position.set(0.08, 1.32, 0.05)
  const earR = earL.clone()
  earR.position.x = 0.22
  root.add(earL, earR)
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.45, 6), mat)
  tail.position.set(-0.35, 0.7, 0)
  tail.rotation.z = 1.1
  root.add(tail)
  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.28, 3, 6), mat)
  legL.position.set(-0.1, 0.3, 0)
  legL.name = 'legL'
  const legR = legL.clone()
  legR.position.x = 0.12
  legR.name = 'legR'
  root.add(legL, legR)
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.2, 3, 6), mat)
  armL.position.set(-0.18, 0.85, 0.1)
  armL.name = 'armL'
  const armR = armL.clone()
  armR.position.x = 0.25
  armR.name = 'armR'
  root.add(armL, armR)
  return root
}

function createPikachu(accent: number): THREE.Group {
  const root = new THREE.Group()
  root.name = 'playerAvatar'
  const yellow = new THREE.MeshStandardMaterial({
    color: accent || 0xfacc15,
    roughness: 0.45,
    metalness: 0.08,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.08,
  })
  const black = new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.7 })
  const red = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.4,
    emissive: 0xef4444,
    emissiveIntensity: 0.15,
  })
  const brown = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 })

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.35, 6, 10), yellow)
  body.position.y = 0.72
  root.add(body)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 14), yellow)
  head.position.set(0, 1.22, 0.05)
  root.add(head)

  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.32, 6), yellow)
  earL.position.set(-0.1, 1.48, 0)
  earL.rotation.z = 0.25
  const earR = earL.clone()
  earR.position.x = 0.1
  earR.rotation.z = -0.25
  root.add(earL, earR)
  const tipL = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.1, 5), black)
  tipL.position.set(-0.12, 1.62, 0)
  tipL.rotation.z = 0.25
  const tipR = tipL.clone()
  tipR.position.x = 0.12
  tipR.rotation.z = -0.25
  root.add(tipL, tipR)

  const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), red)
  cheekL.position.set(-0.16, 1.15, 0.12)
  const cheekR = cheekL.clone()
  cheekR.position.x = 0.16
  root.add(cheekL, cheekR)

  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.35, 0.06), yellow)
  tail.position.set(-0.32, 0.85, 0)
  tail.rotation.z = 0.9
  root.add(tail)
  const tailTip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.05), brown)
  tailTip.position.set(-0.48, 1.05, 0)
  root.add(tailTip)

  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.22, 3, 6), yellow)
  legL.position.set(-0.1, 0.28, 0)
  legL.name = 'legL'
  const legR = legL.clone()
  legR.position.x = 0.1
  legR.name = 'legR'
  root.add(legL, legR)

  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.18, 3, 6), yellow)
  armL.position.set(-0.22, 0.85, 0.08)
  armL.name = 'armL'
  const armR = armL.clone()
  armR.position.x = 0.22
  armR.name = 'armR'
  root.add(armL, armR)

  return root
}

function createEevee(accent: number): THREE.Group {
  const root = new THREE.Group()
  root.name = 'playerAvatar'
  const mat = new THREE.MeshStandardMaterial({ color: accent || 0xc4a574, roughness: 0.55, metalness: 0.05 })
  const cream = new THREE.MeshStandardMaterial({ color: 0xf5e6d3, roughness: 0.6 })
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.38, 6, 8), mat)
  body.position.y = 0.7
  root.add(body)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 12), mat)
  head.position.set(0.08, 1.12, 0.05)
  root.add(head)
  const ruff = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), cream)
  ruff.position.set(0.05, 1.0, 0.08)
  ruff.scale.set(1.2, 0.7, 1.1)
  root.add(ruff)
  const earL = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 5), mat)
  earL.position.set(-0.06, 1.35, 0)
  earL.rotation.z = 0.35
  const earR = earL.clone()
  earR.position.x = 0.18
  earR.rotation.z = -0.35
  root.add(earL, earR)
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 6), cream)
  tail.position.set(-0.35, 0.65, 0)
  tail.rotation.z = 1.0
  root.add(tail)
  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.26, 3, 6), mat)
  legL.position.set(-0.1, 0.28, 0)
  legL.name = 'legL'
  const legR = legL.clone()
  legR.position.x = 0.12
  legR.name = 'legR'
  root.add(legL, legR)
  const armL = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.18, 3, 6), mat)
  armL.position.set(-0.2, 0.82, 0.08)
  armL.name = 'armL'
  const armR = armL.clone()
  armR.position.x = 0.24
  armR.name = 'armR'
  root.add(armL, armR)
  return root
}

/** Walk cycle — returns updated phase for callers that chain the value */
export function tickAvatarWalk(
  avatar: THREE.Group,
  phase: number,
  intensity: number,
  dt = 0.016,
): number {
  const next = phase + dt * (6 + intensity * 4)
  const legL = avatar.getObjectByName('legL')
  const legR = avatar.getObjectByName('legR')
  const armL = avatar.getObjectByName('armL')
  const armR = avatar.getObjectByName('armR')
  const swing = Math.sin(next) * 0.45 * Math.min(1, intensity)
  if (legL) legL.rotation.x = swing
  if (legR) legR.rotation.x = -swing
  if (armL) armL.rotation.x = -swing * 0.8
  if (armR) armR.rotation.x = swing * 0.8
  avatar.position.y =
    intensity > 0.05 ? Math.abs(Math.sin(next * 2)) * 0.03 * Math.min(1, intensity) : 0
  return next
}
