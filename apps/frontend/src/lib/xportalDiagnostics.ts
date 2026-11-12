/**
 * Public WalletConnect errors must never echo provider exceptions.
 * They can contain ephemeral wc: pairing URIs (with symKey), relay query params,
 * project identifiers, session topics or device-local diagnostics.
 * The raw exception is used for local classification ONLY, not logged or rendered.
 */
export function safeXPortalLoginError(reason: unknown): string {
  const message=reason instanceof Error?reason.message:typeof reason==='string'?reason:''
  if(/connexion annulée|cancel|aborterror|aborted/i.test(message))
    return 'Connexion xPortal annulée. Tu peux réessayer.'
  if(/reject|refus|declin/i.test(message))
    return 'Connexion refusée dans xPortal. Aucun wallet connecté.'
  if(/unauthorized|forbidden|not.allowed|origin|project.?id|401|403/i.test(message))
    return 'WalletConnect refuse ce domaine. Vérifie les origines xartists.art et www.xartists.art dans Reown Cloud, puis réessaie.'
  if(/WalletConnect bloqué avant QR|pairing|proposal|proposition/i.test(message))
    return 'Le QR xPortal ne peut pas être créé. Réessaie dans Chrome ou Safari hors navigateur intégré.'
  if(/relay|relai|relais|websocket|timeout|timed? out/i.test(message))
    return 'Relais WalletConnect indisponible. Vérifie la connexion réseau et réessaie.'
  return 'Connexion xPortal impossible. Réessaie ou utilise le mode découverte sans wallet.'
}
