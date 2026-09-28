/**
 * Playable museum avatars (3rd person) — human + creature skins.
 * Lightweight meshes — no external GLB for demo.
 */
import * as THREE from 'three'

export type AvatarSkinId = 'human' | 'dragon' | 'eagle' | 'dragonfly' | 'fox'

export const AVATAR_SKINS: { id: AvatarSkinId; label: string; accent: number }[] = [
  { id: 'human', label: 'Explorateur', accent: 0x8b5cf6 },
  { id: 'dragon', label: 'Dragon', accent: 0xef4444 },
  { id: 'eagle', label: 'Aigle', accent: 0xf59e0b },
  { id: 'dragonfly', label: 'Libellule', accent: 0x22d3ee },
  { id: 'fox', label: 'Renard', accent: 0xf97316 },
]

const STORAGE_KEY = 'xartists.museum.avatarSkin'

export function loadAvatarSkin(): AvatarSkinId {
  try {
    const v = localStorage.getItem(STORAGE_KEY) as AvatarSkinId | null
    if (v && AVATAR_SKINS.some(s => s.id === v)) return v
  } catch {
    /* ignore */
  }
  return 'human'
}

export function saveAvatarSkin(id: AvatarSkinId) {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {
    /* ignore */
  }
}

export function createPlayerAvatar(
  skin: AvatarSkinId = 'human',
  accentOverride?: number,
): THREE.Group {
  const meta = AVATAR_SKINS.find(s => s.id === skin) || AVATAR_SKINS[0]
  const accent = accentOverride ?? meta.accent
  if (skin === 'dragon') return createDragon(accent)
  if (skin === 'eagle') return createEagle(accent)
  if (skin === 'dragonfly') return createDragonfly(accent)
  if (skin === 'fox') return createFox(accent)
  return createHuman(accent)
}

function createHuman(accent: number): THREE.Group {
  const root = new THREE.Group()
  root.name = 'playerAvatar'
  root.userData.skin = 'human'

  const skin = new THREE.MeshStandardMaterial({
    color: 0xc4a574,
    roughness: 0.65,
    metalness: 0.05,
  })
  const cloth = new THREE.MeshStandardMaterial({
    color: accent,
    roughness: 0.45,
    metalness: 0.15,
    emissive: accent,
    emissiveIntensity: 0.12,
  })
  const dark = new THREE.MeshStandardMaterial({
    color: 0x1e1b2e,
    roughness: 0.7,
    metalness: 0.1,
  })

  const legGeo = new THREE.CapsuleGeometry(0.11, 0.45, 4, 8)
  const legL = new THREE.Mesh(legGeo, dark)
  legL.position.set(-0.12, 0.35, 0)
  legL.name = 'legL'
  const legR = new THREE.Mesh(legGeo, dark)
  legR.position.set(0.12, 0.35, 0)
  legR.name = 'legR'
  root.add(legL, legR)

  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.4, 6, 10), cloth)
  torso.position.y = 1.05
  root.add(torso)

  const armGeo = new THREE.CapsuleGeometry(0.07, 0.38, 4, 8)
  const armL = new THREE.Mesh(armGeo, cloth)
  armL.position.set(-0.32, 1.05, 0)
  armL.name = 'armL'
  const armR = new THREE.Mesh(armGeo, cloth)
  armR.position.set(0.32, 1.05, 0)
  armR.name = 'armR'
  root.add(armL, armR)

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 14), skin)
  head.position.y = 1.55
  root.add(head)

  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.06, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x22d3ee,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.6,
    }),
  )
  visor.position.set(0, 1.56, 0.12)
  root.add(visor)
  return root
}

function createDragon(accent: number): THREE.Group {
  const root = new THREE.Group()
  root.name = 'playerAvatar'
  root.userData.skin = 'dragon'
  const mat = new THREE.MeshStandardMaterial({
    color: accent,
    roughness: 0.35,
    metalness: 0.25,
    emissive: accent,
    emissiveIntensity: 0.2,
  })
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.55, 6, 10), mat)
  body.position.y = 0.85
  root.add(body)
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.4, 8), mat)
  head.rotation.z = Math.PI / 2
  head.position.set(0.35, 1.25, 0)
  root.add(head)
  const wingL = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.7, 4), mat)
  wingL.position.set(-0.45, 1.1, 0)
  wingL.rotation.z = 0.6
  wingL.name = 'armL'
  const wingR = wingL.clone()
  wingR.position.x = 0.45
  wingR.rotation.z = -0.6
  wingR.name = 'armR'
  root.add(wingL, wingR)
  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.3, 4, 6), mat)
  legL.position.set(-0.15, 0.25, 0)
  legL.name = 'legL'
  const legR = legL.clone()
  legR.position.x = 0.15
  legR.name = 'legR'
  root.add(legL, legR)
  return root
}

function createEagle(accent: number): THREE.Group {
  const root = new THREE.Group()
  root.name = 'playerAvatar'
  root.userData.skin = 'eagle'
  const mat = new THREE.MeshStandardMaterial({
    color: accent,
    roughness: 0.4,
    metalness: 0.15,
    emissive: accent,
    emissiveIntensity: 0.15,
  })
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 12), mat)
  body.scale.set(1, 0.85, 1.2)
  body.position.y = 0.9
  root.add(body)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), mat)
  head.position.set(0.2, 1.15, 0.1)
  root.add(head)
  const beak = new THREE.Mesh(
    new THREE.ConeGeometry(0.05, 0.18, 6),
    new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.3 }),
  )
  beak.rotation.z = -Math.PI / 2
  beak.position.set(0.35, 1.12, 0.12)
  root.add(beak)
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.35), mat)
  wingL.position.set(-0.4, 0.95, 0)
  wingL.name = 'armL'
  const wingR = wingL.clone()
  wingR.position.x = 0.4
  wingR.name = 'armR'
  root.add(wingL, wingR)
  const legL = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.25, 3, 6), mat)
  legL.position.set(-0.1, 0.4, 0)
  legL.name = 'legL'
  const legR = legL.clone()
  legR.position.x = 0.1
  legR.name = 'legR'
  root.add(legL, legR)
  return root
}

function createDragonfly(accent: number): THREE.Group {
  const root = new THREE.Group()
  root.name = 'playerAvatar'
  root.userData.skin = 'dragonfly'
  const mat = new THREE.MeshStandardMaterial({
    color: accent,
    roughness: 0.25,
    metalness: 0.4,
    emissive: accent,
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.92,
  })
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.08, 0.7, 4, 8), mat)
  body.rotation.z = Math.PI / 2
  body.position.y = 0.9
  root.add(body)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), mat)
  head.position.set(0.4, 0.9, 0)
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
  root.userData.skin = 'fox'
  const mat = new THREE.MeshStandardMaterial({
    color: accent,
    roughness: 0.55,
    metalness: 0.08,
  })
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

/** Walk cycle — limb swing from speed 0..1 */
export function tickAvatarWalk(avatar: THREE.Group, phase: number, intensity: number) {
  const legL = avatar.getObjectByName('legL')
  const legR = avatar.getObjectByName('legR')
  const armL = avatar.getObjectByName('armL')
  const armR = avatar.getObjectByName('armR')
  const swing = Math.sin(phase) * 0.45 * intensity
  if (legL) legL.rotation.x = swing
  if (legR) legR.rotation.x = -swing
  if (armL) armL.rotation.x = -swing * 0.8
  if (armR) armR.rotation.x = swing * 0.8
  avatar.position.y = intensity > 0.05 ? Math.abs(Math.sin(phase * 2)) * 0.03 * intensity : 0
}
