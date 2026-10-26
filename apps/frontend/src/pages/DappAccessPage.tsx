import { useEffect, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { useCopy } from '../experience/state'
import Icon from '../experience/Icon'
import { useI18n } from '../i18n/I18nContext'
import { requestOpenConnect } from '../lib/walletEvents'
import { getInstallStatus, getServerInstallStatus, subscribeInstall, installDapp } from '../pwa/installPrompt'

/** One public link to explore, install, or connect from desktop and mobile. */
export default function DappAccessPage() {
  const c = useCopy()
  const { lang } = useI18n()
  const installed = useSyncExternalStore(subscribeInstall, getInstallStatus, getServerInstallStatus)
  const [url, setUrl] = useState('')
  const [qr, setQr] = useState('')
  const [qrFailed, setQrFailed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)
  const [online, setOnline] = useState(true)
  const [ios, setIos] = useState(false)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const link = new URL('app/', new URL(import.meta.env.BASE_URL, window.location.origin))
    link.searchParams.set('lang', lang)
    setUrl(link.href)
    let current = true
    import('qrcode').then(q => q.toDataURL(link.href, { width: 256, margin: 2, color: { dark: '#10120f', light: '#ffffff' } }))
      .then(value => { if (current) setQr(value) })
      .catch(() => { if (current) setQrFailed(true) })
    setIos(/iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1))
    const network = () => setOnline(navigator.onLine)
    network()
    window.addEventListener('online', network)
    window.addEventListener('offline', network)
    return () => { current = false; window.removeEventListener('online', network); window.removeEventListener('offline', network) }
  }, [lang])
  const copy = async () => {
    setError(false)
    try { await navigator.clipboard.writeText(url); setCopied(true) }
    catch { setError(true); document.getElementById('xa-app-link')?.focus() }
  }
  const share = async () => {
    setError(false)
    try {
      if (navigator.share) await navigator.share({ title: 'xArtists', url })
      else await copy()
    } catch (reason) {
      if (!(reason instanceof Error) || reason.name !== 'AbortError') await copy()
    }
  }
  const install = async () => {
    setBusy(true); setError(false)
    try { await installDapp() } catch { setError(true) } finally { setBusy(false) }
  }
  return <div className="xa-access">
    <div className="xa-access-intro"><p>{c('accessLead')}</p></div>
    {!online && <p className="xa-access-notice" role="status">{c('accessOffline')}</p>}
    <div className="xa-access-grid">
      <section className="xa-access-card"><span className="xa-module-icon"><Icon name="globe" size={25}/></span><h2>{c('accessBrowser')}</h2><p>{c('accessBrowserLead')}</p><Link className="xa-button primary" to="/explore">{c('explore')}<Icon name="arrow" size={17}/></Link></section>
      <section className="xa-access-card"><span className="xa-module-icon"><Icon name="wallet" size={25}/></span><h2>xPortal</h2><p>{c('accessXportalLead')}</p><button type="button" className="xa-button secondary" onClick={requestOpenConnect} disabled={!online}>{c('connect')}<Icon name="wallet" size={17}/></button></section>
      <section className="xa-access-card"><span className="xa-module-icon"><Icon name="create" size={25}/></span><h2>{c(installed === 'installed' ? 'accessInstalled' : 'accessInstall')}</h2><p>{c(ios ? 'accessIos' : 'accessManual')}</p>{installed === 'ready' && <button type="button" className="xa-button secondary" onClick={() => void install()} disabled={busy}>{c('accessInstall')}<Icon name="arrow" size={17}/></button>}{installed === 'installed' && <span className="xa-small-badge"><Icon name="check" size={16}/>{c('accessInstalled')}</span>}</section>
    </div>
    <section className="xa-access-share"><div><div className="xa-eyebrow">iOS / Android / Desktop</div><h2>{c('accessShare')}</h2><p>{c('accessQr')}</p><label htmlFor="xa-app-link" className="sr-only">{c('accessCopy')}</label><input id="xa-app-link" readOnly value={url} onFocus={event => event.currentTarget.select()}/><div className="xa-access-actions"><button type="button" className="xa-button primary" disabled={!url} onClick={() => void share()}>{c('accessShare')}<Icon name="external" size={16}/></button><button type="button" className="xa-button secondary" disabled={!url} onClick={() => void copy()}>{c(copied ? 'accessCopied' : 'accessCopy')}<Icon name={copied ? 'check' : 'layers'} size={16}/></button></div><p className="xa-access-feedback" role="status">{error ? c('accessActionFailed') : copied ? c('accessCopied') : ''}</p></div><div className="xa-access-qr">{qr ? <img src={qr} width={220} height={220} alt={c('accessQr')}/> : qrFailed ? <span>{c('accessQrUnavailable')}</span> : <span className="xa-loader"/>}</div></section>
    <p className="xa-access-safety"><Icon name="shield" size={18}/>{c('accessSignature')}</p>
  </div>
}
