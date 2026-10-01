/**
 * Boot: inject TX bridge + restore xPortal WC session (multi-TX).
 */
import { useEffect } from 'react'
import { bootstrapSendTx } from '../providers/bootstrapSendTx'
import { ensureXPortalSession } from '../lib/xportalWc'
import { refreshRuntimeCodehashes } from '../lib/runtimeCodehash'

export default function TransactionMonitor() {
  useEffect(() => {
    bootstrapSendTx()
    void ensureXPortalSession()
    void refreshRuntimeCodehashes()
  }, [])
  return null
}
