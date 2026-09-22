/**
 * LAB — multiplayer presence (stub for GH Pages build).
 * Full R3F version requires @react-three/fiber + drei + VITE_MULTIPLAYER_URL.
 * This stub keeps the route buildable without those deps.
 */
import { useEffect } from 'react'

export type RemoteUser = {
  id: string
  position: [number, number, number]
  color: string
}

export function multiplayerEnabled(): boolean {
  const url = import.meta.env.VITE_MULTIPLAYER_URL as string | undefined
  return Boolean(url && url.startsWith('http'))
}

/**
 * No-op in production demo until R3F deps are added to package.json.
 */
export default function MultiplayerScene({
  roomId,
}: {
  roomId: string
  myColor?: string
}) {
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.info('[MultiplayerScene] stub active — room', roomId)
    }
  }, [roomId])
  return null
}
