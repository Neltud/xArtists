import { useEffect, useState } from 'react'
import {
  getChainMirror,
  subscribeChainMirror,
  startChainMirror,
  type ChainMirrorSnapshot,
} from '../lib/chainMirror'

export function useChainMirror(): ChainMirrorSnapshot {
  const [snap, setSnap] = useState<ChainMirrorSnapshot>(() => getChainMirror())

  useEffect(() => {
    const unsub = subscribeChainMirror(setSnap)
    const stop = startChainMirror(45_000)
    return () => {
      unsub()
      stop()
    }
  }, [])

  return snap
}
