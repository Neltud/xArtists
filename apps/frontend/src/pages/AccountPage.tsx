/**
 * Walletless customer area. No mock accounts or wallet-equivalent login.
 * Neon OTP is contacted only after the server's real account-session capability
 * and the operator-pinned Neon Auth URL are BOTH present.
 */
import {useMemo,useState,type FormEvent} from 'react'
import {Link} from 'react-router-dom'
import {useI18n} from '../i18n/I18nContext'
import {useCommercialCatalog} from '../hooks/useCommercialCatalog'
import {
  PUBLIC_ACCESS_API,verifiedNeonAuthBase,verifiedXartistsApiBase,
  requestWalletlessOtp,completeWalletlessOtp,type WalletlessProfile,
} from '../lib/walletlessOtp.mjs'

const COPY={
  fr:{
    eyebrow:'xArtists · Espace personnel',
    title:'Mon compte, avec ou sans wallet',
    description:'Un compte e-mail vérifié sert à accéder aux services et aux analyses. Un wallet MultiversX peut être relié séparément après une preuve de propriété. Aucun achat ou droit NFT n’est créé ici.',
    disabled:'Création et connexion des comptes e-mail non encore disponibles : stockage et identité de production en cours de certification.',
    configMissing:'Le service e-mail de production n’est pas encore configuré. Aucun code ne sera envoyé.',
    loading:'Vérification de la disponibilité du compte…',
    live:'Connexion par code e-mail disponible.',
    authTitle:'Connexion e-mail sécurisée',
    email:'Adresse e-mail',otp:'Code reçu par e-mail',
    send:'Recevoir un code',verify:'Valider et ouvrir mon compte',
    sending:'Vérification…',
    sent:'Demande transmise au fournisseur. Si le compte est éligible, un code peut être envoyé. Consultez votre boîte mail.',
    invalid:'Impossible de terminer la connexion. Vérifiez le code et la session, puis réessayez. Aucune donnée personnelle n’est publiée.',
    emailHint:'Le code est traité uniquement par Neon Auth. xArtists ne reçoit jamais votre code OTP et n’enregistre pas votre mot de passe.',
    accountTitle:'Compte vérifié',
    accountType:'Type de compte',walletCount:'Wallets liés en base',rights:'Droits aux analyses et abonnements',
    notChecked:'Non vérifiés — aucun achat ni accès payant présumé',
    clear:'Effacer cet affichage',
    clearHint:'Cette action efface uniquement les informations affichées sur cette page. Elle ne clôt pas la session gérée par Neon Auth.',
    walletless:'Compte e-mail sans wallet',linked:'Compte e-mail avec wallet lié',
    walletWarning:'Un wallet visible ou associé ne prouve pas à lui seul sa possession actuelle : une signature SIWX distincte sera requise pour agir.',
    identity:'Identité blockchain et herotag',offers:'Voir les offres',back:'Découvrir xOrus',
    security:'Aucune donnée saisie n’est envoyée dans un ticket public. Aucune transaction, signature, paiement ou mint ne peut être déclenché depuis cette page.',
  },
  en:{
    eyebrow:'xArtists · Personal area',
    title:'My account, with or without a wallet',
    description:'A verified email account is the starting point for services and analysis. A MultiversX wallet can be linked separately after ownership proof. No payment or NFT rights are created here.',
    disabled:'Email account registration and login are not available yet: production storage and identity are awaiting certification.',
    configMissing:'Production email service is not configured yet. No code will be sent.',
    loading:'Checking account availability…',
    live:'Email code sign-in is available.',
    authTitle:'Secure email sign-in',
    email:'Email address',otp:'Email verification code',
    send:'Send a code',verify:'Verify and open my account',
    sending:'Checking…',
    sent:'Request sent to the provider. An eligible account may receive a code. Check your inbox.',
    invalid:'Sign-in could not complete. Check your code and session, then try again. Nothing personal is published.',
    emailHint:'Your code goes only to Neon Auth. xArtists never receives your OTP or stores your password.',
    accountTitle:'Verified account',
    accountType:'Account type',walletCount:'Wallets linked in storage',rights:'Analyses and subscription rights',
    notChecked:'Not verified — no paid access or purchase presumed',
    clear:'Clear this screen',
    clearHint:'This clears information shown on this page only. It does not revoke the session managed by Neon Auth.',
    walletless:'Email-only account',linked:'Email account with linked wallet',
    walletWarning:'A linked or visible wallet does not prove current ownership. A separate SIWX signature is required for any action.',
    identity:'Blockchain identity and herotag',offers:'Browse offers',back:'Explore xOrus',
    security:'No personal information is sent to a public issue. This page cannot trigger transactions, signatures, payments or mint.',
  },
} as const

export default function AccountPage(){
  const {lang}=useI18n()
  const t=lang==='fr'?COPY.fr:COPY.en
  const {catalog,status}=useCommercialCatalog()
  const neonBase=useMemo(()=>verifiedNeonAuthBase(
    (import.meta.env.VITE_NEON_AUTH_URL as string|undefined)||''),[])
  const apiBase=useMemo(()=>verifiedXartistsApiBase(
    (import.meta.env.VITE_ACCESS_API_BASE as string|undefined)||PUBLIC_ACCESS_API),[])
  const live=status==='verified'&&catalog?.walletless_account_session_enabled===true&&
    neonBase!==null&&apiBase!==null
  const [email,setEmail]=useState('')
  const [otp,setOtp]=useState('')
  const [stage,setStage]=useState<'email'|'otp'>('email')
  const [busy,setBusy]=useState(false)
  const [info,setInfo]=useState('')
  const [profile,setProfile]=useState<WalletlessProfile|null>(null)

  const requestCode=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    if(!live||busy||!neonBase||!apiBase)return
    setBusy(true);setInfo('')
    try{
      await requestWalletlessOtp({email:email.trim(),authBase:neonBase,apiBase})
      setStage('otp');setInfo(t.sent)
    }catch{
      setInfo(t.invalid)
    }finally{setBusy(false)}
  }
  const complete=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault()
    if(!live||busy||!neonBase||!apiBase)return
    setBusy(true);setInfo('')
    try{
      const account=await completeWalletlessOtp({
        email:email.trim(),otp:otp.trim(),authBase:neonBase,apiBase,
      })
      setProfile(account);setOtp('');setEmail('');setStage('email')
    }catch{setInfo(t.invalid)}
    finally{setBusy(false)}
  }
  const clear=()=>{setProfile(null);setEmail('');setOtp('');setStage('email');setInfo('')}

  return <main className="mx-auto w-full max-w-3xl space-y-6 px-4 pb-24 pt-7 text-zinc-900 dark:text-zinc-100 sm:px-7">
    <header className="space-y-3 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900 sm:p-9">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">{t.eyebrow}</p>
      <h1 className="font-serif text-3xl sm:text-4xl">{t.title}</h1>
      <p className="text-sm leading-7 text-zinc-700 dark:text-zinc-300">{t.description}</p>
      <p role="status" aria-live="polite" data-testid="account-readiness"
        className="mt-3 rounded-xl border border-zinc-300 px-4 py-3 text-sm dark:border-zinc-700">
        {status==='loading'?t.loading:status!=='verified'||!catalog?.walletless_account_session_enabled?
          t.disabled:!neonBase||!apiBase?t.configMissing:t.live}
      </p>
    </header>
    {profile ? <section className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900 sm:p-8">
      <h2 className="font-serif text-2xl">{t.accountTitle}</h2>
      <p className="break-all font-mono text-xs text-zinc-600 dark:text-zinc-400">ID : {profile.id}</p>
      <p><strong>{t.accountType} :</strong> {profile.type==='walletless'?t.walletless:t.linked}</p>
      <p><strong>{t.walletCount} :</strong> {profile.linkedWalletCount}</p>
      <p><strong>{t.rights} :</strong> {t.notChecked}</p>
      <p className="text-sm leading-6 text-amber-900 dark:text-amber-200">{t.walletWarning}</p>
      <button type="button" onClick={clear} className="min-h-[44px] rounded-xl border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700">{t.clear}</button>
      <p className="text-xs text-zinc-500">{t.clearHint}</p>
    </section> : live ? <section className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900 sm:p-8">
      <h2 className="font-serif text-2xl">{t.authTitle}</h2>
      <form onSubmit={stage==='email'?requestCode:complete} className="space-y-4">
        <label htmlFor="account-email" className="block text-sm font-semibold">{t.email}</label>
        <input id="account-email" type="email" autoComplete="email" required maxLength={254}
          value={email} onChange={e=>{setEmail(e.target.value);setStage('email');setOtp('')}}
          className="min-h-[48px] w-full rounded-xl border border-zinc-300 bg-white px-4 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"/>
        {stage==='otp'&&<><label htmlFor="account-otp" className="block text-sm font-semibold">{t.otp}</label>
          <input id="account-otp" type="text" inputMode="numeric" autoComplete="one-time-code" required
            minLength={4} maxLength={10} pattern="[0-9]{4,10}" value={otp} onChange={e=>setOtp(e.target.value)}
            className="min-h-[48px] w-full rounded-xl border border-zinc-300 bg-white px-4 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"/></>}
        <button type="submit" disabled={busy} className="min-h-[48px] w-full rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900">
          {busy?t.sending:stage==='email'?t.send:t.verify}
        </button>
      </form>
      {info&&<p role="status" aria-live="polite" className="text-sm leading-6 text-amber-900 dark:text-amber-200">{info}</p>}
      <p className="text-xs leading-6 text-zinc-600 dark:text-zinc-400">{t.emailHint}</p>
    </section> : null}
    <nav className="flex flex-wrap gap-3">
      <Link to="/offres" className="min-h-[44px] rounded-xl border border-zinc-300 px-4 py-3 text-sm dark:border-zinc-700">{t.offers}</Link>
      <Link to="/intelligence/xorus" className="min-h-[44px] rounded-xl border border-zinc-300 px-4 py-3 text-sm dark:border-zinc-700">{t.back}</Link>
      <Link to="/workspace/identity" className="min-h-[44px] rounded-xl border border-zinc-300 px-4 py-3 text-sm dark:border-zinc-700">{t.identity}</Link>
    </nav>
    <p className="text-xs leading-6 text-zinc-600 dark:text-zinc-400">{t.security}</p>
  </main>
}
