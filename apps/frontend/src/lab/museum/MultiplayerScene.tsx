/**
 * LAB — multiplayer presence in museum rooms (R3F).
 * Requires VITE_MULTIPLAYER_URL (Socket.IO). Disabled on static GH Pages by default.
 * Integrates with museumVisitors presence model (room = museumId).
 *
 * Adapted from Claude proposal: throttle emits, no hard localhost, graceful offline.
 */
import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Text } from '@react-three/drei'
import * as THREE from 'three'

export type RemoteUser = {
  id: string
  position: [number, number, number]
  color: string
}

const EMIT_MS = 80
const LERP = 0.18

function multiplayerEnabled(): boolean {
  const url = import.meta.env.VITE_MULTIPLAYER_URL as string | undefined
  return Boolean(url && url.startsWith('http'))
}

/**
 * Affiche les avatars distants dans une scène R3F (salle musée).
 * Sans serveur → rendu vide (pas d’erreur).
 */
export default function MultiplayerScene({
  roomId,
  myColor = '#22d3ee',
}: {
  roomId: string
  myColor?: string
}) {
  const [remoteUsers, setRemoteUsers] = useState<Record<string, RemoteUser>>({})
  const userPositions = useRef<Record<string, THREE.Vector3>>({})
  const socketRef = useRef<{ emit: (e: string, d?: unknown) => void; on: (e: string, fn: (d: unknown) => void) => void; disconnect: () => void } | null>(null)
  const lastEmit = useRef(0)

  useEffect(() => {
    if (!multiplayerEnabled()) return

    let cancelled = false
    ;(async () => {
      try {
        // Dynamic import — avoid bundling socket.io when offline demo
        const { io } = await import('socket.io-client')
        if (cancelled) return
        const url = import.meta.env.VITE_MULTIPLAYER_URL as string
        const socket = io(url, { transports: ['websocket', 'polling'], autoConnect: true })
        socketRef.current = socket

        socket.emit('join_room', { room_id: roomId, color: myColor })

        socket.on('user_moved', (data: unknown) => {
          const d = data as { user_id: string; position: [number, number, number]; color?: string }
          if (!d?.user_id || !d.position) return
          setRemoteUsers(prev => ({
            ...prev,
            [d.user_id]: {
              id: d.user_id,
              position: d.position,
              color: d.color || prev[d.user_id]?.color || '#ffffff',
            },
          }))
          userPositions.current[d.user_id] = new THREE.Vector3(...d.position)
        })

        socket.on('user_joined', (data: unknown) => {
          const d = data as { user_id: string; color?: string }
          if (!d?.user_id) return
          setRemoteUsers(prev => ({
            ...prev,
            [d.user_id]: {
              id: d.user_id,
              position: [0, 1.6, 0],
              color: d.color || '#a78bfa',
            },
          }))
        })

        socket.on('user_left', (data: unknown) => {
          const d = data as { user_id: string }
          if (!d?.user_id) return
          setRemoteUsers(prev => {
            const next = { ...prev }
            delete next[d.user_id]
            return next
          })
          delete userPositions.current[d.user_id]
        })
      } catch {
        /* offline / no dep */
      }
    })()

    return () => {
      cancelled = true
      try {
        socketRef.current?.disconnect()
      } catch {
        /* ignore */
      }
      socketRef.current = null
    }
  }, [roomId, myColor])

  useFrame(state => {
    const sock = socketRef.current
    if (!sock) return
    const now = performance.now()
    if (now - lastEmit.current < EMIT_MS) return
    lastEmit.current = now
    const p = state.camera.position
    sock.emit('update_position', {
      room_id: roomId,
      position: [p.x, p.y, p.z],
    })
  })

  return (
    <group>
      {Object.values(remoteUsers).map(user => (
        <RemoteUserAvatar key={user.id} user={user} positions={userPositions.current} />
      ))}
    </group>
  )
}

function RemoteUserAvatar({
  user,
  positions,
}: {
  user: RemoteUser
  positions: Record<string, THREE.Vector3>
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const target = positions[user.id]
    if (target && meshRef.current) {
      meshRef.current.position.lerp(target, LERP)
    }
  })

  return (
    <group>
      <Sphere ref={meshRef} args={[0.28, 16, 16]} castShadow>
        <meshStandardMaterial color={user.color} emissive={user.color} emissiveIntensity={0.45} />
      </Sphere>
      <Text position={[0, 0.55, 0]} fontSize={0.18} color="#e4e4e7" anchorX="center">
        {`User_${user.id.slice(0, 4)}`}
      </Text>
    </group>
  )
}

export { multiplayerEnabled }
