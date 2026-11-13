/**
 * xArtists Mail — internal provisioning policy, deliberately not exposed as a
 * public route. Only a verified server-side account identity may request one
 * real mailbox. An SMTP alias or a DNS record is never treated as a mailbox.
 *
 * Provider must implement createMailbox with authenticated, secure mailbox
 * access (OIDC/SSO or equivalent), not only create a forwarding address.
 */
const DOMAIN='xartists.art'
const BLOCKED=new Set([
  'abuse','admin','administrator','adminsys','billing','contact','dmarc',
  'hello','hostmaster','info','legal','mailer-daemon','mail','noreply',
  'no-reply','postmaster','privacy','root','security','support','webmaster',
  'www','sales','smtp','imap','pop','help','test',
])
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function mailboxAddress(localPart) {
  if (typeof localPart!=='string') throw new TypeError('invalid_mailbox_name')
  const s=localPart.trim().toLowerCase()
  if (s.length<3||s.length>32||
    !/^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/.test(s)||BLOCKED.has(s)||
    s.startsWith('xn--')) throw new TypeError('invalid_mailbox_name')
  return `${s}@${DOMAIN}`
}

const fail=code=>Object.freeze({ok:false,error:code})
export function createMailboxProvisioningService({enabled=false,verifySession,store,provider,originAllowed}={}) {
  const configured=enabled===true && typeof verifySession==='function' &&
    typeof store?.reserve==='function' && typeof store?.markProvisioned==='function' &&
    typeof store?.markNeedsReconciliation==='function' &&
    typeof provider?.createMailbox==='function' &&
    provider?.accountLoginVerified===true && typeof originAllowed==='function'

  return Object.freeze({
    readiness() {return Object.freeze({enabled:configured,mailbox_delivery_verified:false})},
    async request({bearerToken,localPart,origin}={}) {
      if (!configured) return fail('mailbox_service_unavailable')
      if (typeof bearerToken!=='string'||bearerToken.length<20||bearerToken.length>8192)
        return fail('session_required')
      if (!originAllowed(origin)) return fail('origin_not_allowed')
      let address
      try {address=mailboxAddress(localPart)} catch {return fail('invalid_mailbox_name')}
      let userId
      try {userId=await verifySession(bearerToken)} catch {return fail('session_not_verified')}
      if (typeof userId!=='string'||!UUID.test(userId)) return fail('session_not_verified')

      // reserve MUST be atomic with DB uniqueness on user_id and address.
      // Existing pending/provisioned rows are NOT replayed into provider create.
      let reservation
      try {reservation=await store.reserve({userId,address})}
      catch {return fail('mailbox_reservation_unavailable')}
      if (reservation?.state==='exists') return fail('mailbox_already_requested')
      if (reservation?.state==='taken') return fail('mailbox_name_unavailable')
      if (reservation?.state!=='reserved'||!UUID.test(reservation.id||''))
        return fail('mailbox_reservation_unavailable')
      try {
        const result=await provider.createMailbox({address,accountId:userId,reservationId:reservation.id})
        if (typeof result?.providerId!=='string'||result.providerId.length<1||result.providerId.length>255)
          throw new Error('unconfirmed_provider_result')
        // A provider ack is NOT receipt or SMTP/DKIM proof.
        await store.markProvisioned({reservationId:reservation.id,providerId:result.providerId})
        return Object.freeze({ok:true,status:'provisioned',address,
          receiptVerified:false,outboundVerified:false,
          inboxAccessVerified:false})
      } catch {
        // NO automatic retry: provider may have created mailbox then timed out.
        // Preserve reservation for operator reconciliation; no leaked secrets.
        try {await store.markNeedsReconciliation({reservationId:reservation.id})} catch {}
        return fail('mailbox_requires_reconciliation')
      }
    },
  })
}
