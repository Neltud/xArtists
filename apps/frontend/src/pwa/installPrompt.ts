type InstallEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
export type InstallStatus = 'unavailable' | 'ready' | 'installed'
let prompt: InstallEvent | null = null
let status: InstallStatus = 'unavailable'
let listening = false
const subscribers = new Set<() => void>()
function publish(next: InstallStatus) {
  status = next
  for (const notify of subscribers) notify()
}
export function watchInstallPrompt(): void {
  if (listening || typeof window === 'undefined') return
  listening = true
  const standalone = window.matchMedia?.('(display-mode: standalone)')
  const update = () => {
    if (standalone?.matches || (navigator as Navigator & { standalone?: boolean }).standalone) publish('installed')
  }
  update()
  standalone?.addEventListener?.('change', update)
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault()
    prompt = event as InstallEvent
    publish('ready')
  })
  window.addEventListener('appinstalled', () => {
    prompt = null
    publish('installed')
  })
}
export const getInstallStatus = () => status
export const getServerInstallStatus = (): InstallStatus => 'unavailable'
export function subscribeInstall(notify: () => void) {
  subscribers.add(notify)
  return () => { subscribers.delete(notify) }
}
export async function installDapp(): Promise<void> {
  const pending = prompt
  if (!pending) return
  prompt = null
  publish('unavailable')
  await pending.prompt()
  await pending.userChoice
  // Only appinstalled / display-mode confirm that installation actually happened.
}
