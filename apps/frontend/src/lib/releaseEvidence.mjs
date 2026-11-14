/**
 * Public, read-only release evidence. Every probe is independent and nullable.
 * "observed" means an endpoint answered; it NEVER grants signing, money,
 * trading, mint, mailbox or commercial rights.
 */
const SHA=/^[a-f0-9]{40}$/
const shaOf=x=>typeof x?.source_sha==='string'&&SHA.test(x.source_sha)?x.source_sha:null
const asObject=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:null
const row=(key,title,state,detail,issue=null)=>Object.freeze({key,title,state,detail,issue})
const sourceLabel=s=>s?s.slice(0,12)+'…':'indisponible'

export function interpretReleaseEvidence(input={}) {
  const site=asObject(input.site),api=asObject(input.api)
  const health=asObject(input.health),catalog=asObject(input.catalog)
  const studio=asObject(input.studio),xorus=asObject(input.xorus)
  const siteSha=shaOf(site),apiSha=shaOf(api)
  const sameSha=siteSha!==null&&apiSha!==null&&siteSha===apiSha
  const healthValid=health?.ok===true&&health?.service==='access-api'
  const catalogValid=catalog?.ok===true&&catalog?.schema==='xartists_public_commercial_catalog/v1'
  const paperXorus=xorus?.ok===true&&xorus?.report?.schema==='xorus_analysis/v2'
  const studioSchema=studio?.ok===true&&studio?.table_ready===true
  const sessionsDeclared=catalogValid&&catalog.walletless_account_session_enabled===true
  // Runtime flags can be booleans, numeric 0/1, or environment strings.
  // A live execution signal is an *alert*, never proof of an authorized launch.
  const enabled=value=>value===true||value===1||value==='1'||value==='true'
  const flagsRisk=Boolean(
    (healthValid&&(
      enabled(health.paybox_checkout_enabled)||
      enabled(health.mint_live_enabled)||
      enabled(health.lia_live_trading)||
      health.mint_dry_run===false||
      enabled(health.auction_enabled)
    ))||
    // A risky catalog flag is worth reporting even if health fails or
    // the catalog schema is malformed. It never authorizes commerce.
    (catalog&&(
      enabled(catalog.billing_checkout_enabled)||
      enabled(catalog.contract_purchase_enabled)||
      enabled(catalog.mint_enabled)||
      enabled(catalog.sale_open)
    ))
  )
  return Object.freeze({
    observedAt:null, // Caller owns observation timestamp, not server publication time.
    sourceSha:siteSha,
    backendSha:apiSha,
    matchingBuilds:sameSha,
    unsafeFlagReported:flagsRisk,
    rows:Object.freeze([
      row('site','Site public',siteSha?'observed':'unknown',
        siteSha?'SHA déclaré : '+sourceLabel(siteSha):'Aucun build-info public valide'),
      row('backend','API xArtists',apiSha&&healthValid?'observed':'unknown',
        apiSha&&healthValid?'SHA déclaré : '+sourceLabel(apiSha):'Identité du runtime non attestée'),
      row('deployment','Versions site / API',sameSha?'observed':'unknown',
        sameSha?'Même SHA déclaré (pas une homologation commerciale)':
          siteSha&&apiSha?'SHA différents : déploiements non synchronisés ou autonomes':
          'Comparaison impossible sans deux identifiants valides'),
      row('xorus','Analyse xOrus',paperXorus?'observed':'unknown',
        paperXorus?'Rapport serveur consultable · PAPER, aucune vérification indépendante présumée':
          'Rapport serveur non disponible ou schéma invalide',548),
      row('accounts','Comptes sans wallet',sessionsDeclared&&healthValid&&health.walletless_account_session_enabled===true?'partial':'blocked',
        sessionsDeclared&&healthValid&&health.walletless_account_session_enabled===true?
          'Configuration session annoncée ; login OTP réel non certifié':'Session de compte non prouvée en production',465),
      row('mail','Boîtes @xartists.art','blocked',
        'Provisionnement et accès IMAP/JMAP réels non certifiés ; hello@ non vérifié',582),
      row('xportal','Connexion xPortal','blocked',
        'Origines Reown, QR et session volontaire publique non attestés',506),
      row('studio','Studio / IPFS',studioSchema?'partial':'blocked',
        studioSchema?'Schéma du stockage déclaré ; CID, upload, média et restauration non certifiés':
          'Stockage Studio non prouvé sur cette API',281),
      row('market','Marketplace NFT','blocked',
        'Un catalogue ou un historique ne prouvent pas un nouveau listing puis achat et réception',428),
      row('factory','NFT Factory / distributeurs','blocked',
        'Brouillons PAPER uniquement : média/CID, droits, mint et contrat distributeur audité non prouvés',428),
      row('gallery','Galerie 3D / expositions','blocked',
        'Constructeur présent dans le code ; publication serveur, droits d’exposition et vente non certifiés',393),
      row('physical','Œuvres physiques / custody','blocked',
        'Paiement, transporteur, réception signée et revue humaine restent des preuves distinctes',281),
      row('art_id','xArt-ID / provenance','blocked',
        'Empreinte ou similarité ne certifie ni authenticité, ni provenance, ni absence de vol ; revue humaine requise',324),
      row('trailer','Trailer xArtists','blocked',
        'Captures réelles desktop/mobile, droits promotionnels et fichiers MP4 finaux non certifiés'),
      row('fiat','Paiement / abonnements','blocked',
        'Webhook, règlement, droits et révocation de bout en bout non certifiés',548),
      row('chains','Solana / bridge / trading','blocked',
        'Aucune exécution, signature ni livraison interchaîne certifiée',391),
    ]),
  })
}
export async function fetchPublicReleaseEvidence({siteBase,apiBase,fetchImpl=fetch,signal}={}) {
  if(typeof fetchImpl!=='function')throw new TypeError('fetch_required')
  const api=typeof apiBase==='string'?new URL(apiBase):null
  const site=typeof siteBase==='string'?new URL(siteBase):null
  if(!site||site.protocol!=='https:'||!api||api.protocol!=='https:'||
    !['xartists-access-api.onrender.com','api.xartists.art'].includes(api.hostname)||
    api.pathname!=='/'||api.search||api.hash)throw new TypeError('invalid_release_probe_origin')
  const probes={
    site:new URL('build-info.json',site).href,
    api:new URL('/v1/ops/build-info',api).href,
    health:new URL('/health',api).href,
    catalog:new URL('/v1/commercial/catalog',api).href,
    studio:new URL('/v1/ops/studio-store/status',api).href,
    xorus:new URL('/v1/xorus/analysis',api).href,
  }
  async function read(url) {
    try{
      const response=await fetchImpl(url,{method:'GET',cache:'no-store',credentials:'omit',
        redirect:'error',signal:signal||AbortSignal.timeout(9000)})
      if(!response?.ok)return null
      return asObject(await response.json())
    }catch{return null}
  }
  const values=await Promise.all(Object.values(probes).map(read))
  const raw=Object.fromEntries(Object.keys(probes).map((key,i)=>[key,values[i]]))
  return {...interpretReleaseEvidence(raw),observedAt:new Date().toISOString()}
}
