/** Écoute xartists-net-notify → toast i18n. */
import { useEffect } from 'react'
import { useToast } from './ui/Toast'
import { useI18n } from '../i18n/I18nContext'
import { NET_EVENT, type NetNotifyKind } from '../lib/networkNotify'

const KIND_KEY: Record<NetNotifyKind, string> = {
  rateLimit: 'net.rateLimit',
  offline: 'net.offline',
  timeout: 'net.timeout',
  okCache: 'net.okCache',
}

export default function NetworkToastBridge() {
  const { push } = useToast()
  const { t } = useI18n()

  useEffect(() => {
    const on = (ev: Event) => {
      const ce = ev as CustomEvent<{ kind: NetNotifyKind; detail?: string }>
      const kind = ce.detail?.kind || 'offline'
      const key = KIND_KEY[kind] || 'net.offline'
      const text = t(key)
      push(text, kind === 'okCache' ? 'ok' : 'err')
    }
    window.addEventListener(NET_EVENT, on)
    return () => window.removeEventListener(NET_EVENT, on)
  }, [push, t])

  return null
}
