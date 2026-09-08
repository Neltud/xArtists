/**
 * Stylized playable avatar for museum 3rd-person (A1X / game feel).
 * Lightweight meshes — no external GLB required for demo.
 */
import * as THREE from 'three'

export function createPlayerAvatar(accent = 0x8b5cf6): THREE.Group {
  const root = new THREE.Group()
  root.name = 'playerAvatar'

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

  // Legs
  const legGeo = new THREE.CapsuleGeometry(0.11, 0.45, 4, 8)
  const legL = new THREE.Mesh(legGeo, dark)
  legL.position.set(-0.12, 0.35, 0)
  legL.name = 'legL'
  const legR = new THREE.Mesh(legGeo, dark)
  legR.position.set(0.12, 0.35, 0)
  legR.name = 'legR'
  root.add(legL, legR)

  // Torso
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.4, 6, 10), cloth)
  torso.position.y = 1.05
  root.add(torso)

  // Arms
  const armGeo = new THREE.CapsuleGeometry(0.07, 0.38, 4, 8)
  const armL = new THREE.Mesh(armGeo, cloth)
  armL.position.set(-0.32, 1.05, 0)
  armL.name = 'armL'
  const armR = new THREE.Mesh(armGeo, cloth)
  armR.position.set(0.32, 1.05, 0)
  armR.name = 'armR'
  root.add(armL, armR)

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 14), skin)
  head.position.y = 1.55
  root.add(head)

  // Simple visor (cyber accent)
  const visor = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.06, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0x22d3ee,
      emissive: 0x22d3ee,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.6,
    })
  )
  visor.position.set(0, 1.56, 0.12)
  root.add(visor)

  return root
}

/** Walk cycle — subtle limb swing from speed 0..1 */
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
