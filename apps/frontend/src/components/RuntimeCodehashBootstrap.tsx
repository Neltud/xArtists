/** Boot: verify SC codeHash on explorer → unlock REAL / list without Pages secret. */
import { useEffect } from 'react'
import { refreshRuntimeCodehashes } from '../lib/runtimeCodehash'

export default function RuntimeCodehashBootstrap() {
  useEffect(() => {
    void refreshRuntimeCodehashes()
  }, [])
  return null
}
