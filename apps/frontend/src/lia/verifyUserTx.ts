/**
 * Vérifie qu’un TxHash collé par l’utilisateur existe, a réussi,
 * et part du wallet connecté. Aucun broadcast, aucune clé.
 */

const API = 'https://api.multiversx.com'
const HASH_RE = /^[0-9a-f]{64}$/

export type TxCheckInput = {
  status?: string
  sender?: string
  txHash?: string
  receiver?: string
  value?: string
  data?: string
} | null

export type TxVerdict =
  | { ok: true; hash: string; sender: string; status: string }
  | { ok: false; reason: string }

export function normalizeTxHash(raw: string): string | null {
  const h = raw.trim().replace(/^0x/i, '').toLowerCase()
  if (!HASH_RE.test(h)) return null
  return h
}

/** Pure : mappe la réponse API. `expectedSender` vide = refus (pas de match anonyme). */
export function interpretAccountTx(
  tx: TxCheckInput,
  expectedSender: string,
  hash: string,
  expected?: { receiver: string; value: string; data: string },
): TxVerdict {
  if (!tx || typeof tx !== 'object') {
    return { ok: false, reason: 'Transaction introuvable sur l’API MultiversX.' }
  }
  const status = String(tx.status || '').toLowerCase()
  if (status === 'pending' || status === 'received') {
    return { ok: false, reason: 'Transaction encore en attente. Réessaie dans quelques secondes.' }
  }
  if (status !== 'success' && status !== 'successful') {
    return { ok: false, reason: `Transaction non réussie (${tx.status || 'statut inconnu'}).` }
  }
  const sender = String(tx.sender || '').trim()
  const want = expectedSender.trim().toLowerCase()
  if (!want) {
    return { ok: false, reason: 'Connecte ton wallet avant de lier un hash.' }
  }
  if (!sender || sender.toLowerCase() !== want) {
    return {
      ok: false,
      reason: 'L’expéditeur n’est pas le wallet connecté. LIA ne signe pas à ta place.',
    }
  }
  if (tx.txHash && normalizeTxHash(tx.txHash) !== hash) return { ok: false, reason: 'Hash de transaction différent.' }
  if (expected) {
    let matches = false
    try {
      matches = tx.receiver === expected.receiver &&
        BigInt(tx.value ?? '-1') === BigInt(expected.value) &&
        (tx.data ? atob(tx.data) : '') === expected.data
    } catch {
      matches = false
    }
    if (!matches) return { ok: false, reason: 'Destinataire, montant ou appel différents de la transaction attendue.' }
  }
  return { ok: true, hash, sender, status }
}

export async function verifyUserSignedTx(
  rawHash: string,
  expectedSender: string,
  expected: { receiver: string; value: string; data: string },
): Promise<TxVerdict> {
  const hash = normalizeTxHash(rawHash)
  if (!hash) return { ok: false, reason: 'TxHash invalide — 64 caractères hex, sans espace.' }
  let res: Response
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8000)
  try {
    res = await fetch(`${API}/transactions/${hash}`, { cache: 'no-store', signal: controller.signal })
  } catch {
    return { ok: false, reason: 'API MultiversX injoignable. Rien n’a été marqué exécuté.' }
  } finally {
    clearTimeout(timeout)
  }
  if (res.status === 404) return { ok: false, reason: 'Transaction introuvable.' }
  if (!res.ok) return { ok: false, reason: `API MultiversX HTTP ${res.status}. Rien n’a été marqué exécuté.` }
  let body: TxCheckInput = null
  try {
    body = (await res.json()) as TxCheckInput
  } catch {
    return { ok: false, reason: 'Réponse API illisible. Rien n’a été marqué exécuté.' }
  }
  return interpretAccountTx(body, expectedSender, hash, expected)
}
