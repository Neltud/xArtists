/** Deferred beforeinstallprompt — no auto reload during wallet approval. */
type InstallOutcome = 'unsupported' | 'ready' | 'installed' | 'dismissed'

let deferred: any = null
let status: InstallOutcome = 'unsupported'
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()
    deferred = e
    status = 'ready'
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    status = 'installed'
    emit()
  })
}

export function subscribeInstall(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function getInstallStatus(): InstallOutcome {
  return status
}

export function getServerInstallStatus(): InstallOutcome {
  return 'unsupported'
}

export async function installDapp(): Promise<void> {
  if (!deferred) throw new Error('install_unavailable')
  const result = await deferred.prompt()
  deferred = null
  const choice = result?.outcome || 'dismissed'
  status = choice === 'accepted' ? 'installed' : 'dismissed'
  emit()
  if (choice !== 'accepted') throw new Error('install_dismissed')
}
