/**
 * Integrity / safety gates for xArtists dApp.
 * Hard rule: no live buy/list/claim against empty (codeHash null) contracts.
 */

import { DEMO_MODE } from '../config/demoMode'

export type ContractProbe = {
  address: string | null | undefined
  codeHash?: string | null
  codeEmpty?: boolean
}

export type GateResult =
  | { ok: true }
  | { ok: false; code: string; message: string }

/** True when product must not move user funds. */
export function isDemoLocked(): boolean {
  return DEMO_MODE === true
}

/** Reject zero / missing SC addresses. */
export function assertContractAddress(address: string | null | undefined): GateResult {
  if (!address || !address.startsWith('erd1') || address.length < 60) {
    return {
      ok: false,
      code: 'NO_ADDRESS',
      message: 'Contrat non configuré — aucune TX live.',
    }
  }
  return { ok: true }
}

/** Reject undeployed accounts (empty code). */
export function assertLiveContract(probe: ContractProbe): GateResult {
  const addr = assertContractAddress(probe.address)
  if (!addr.ok) return addr

  if (probe.codeEmpty === true || !probe.codeHash) {
    return {
      ok: false,
      code: 'NOT_DEPLOYED',
      message:
        'Smart contract non déployé (codeHash null). Envoi de fonds interdit — mode démo uniquement.',
    }
  }
  return { ok: true }
}

/** Live trading / buy only if demo unlocked AND contract live. */
export function assertUserFundMove(probe: ContractProbe): GateResult {
  if (isDemoLocked()) {
    return {
      ok: false,
      code: 'DEMO_MODE',
      message: 'Mode démo / paper — pas de mouvement de fonds on-chain depuis l’UI.',
    }
  }
  return assertLiveContract(probe)
}

/** LIA ops address must never be the connected end-user session for product flows. */
export function assertNotLiaOpsWallet(
  connected: string | null | undefined,
  liaOps: string | null | undefined
): GateResult {
  if (!connected || !liaOps) return { ok: true }
  if (connected.toLowerCase() === liaOps.toLowerCase()) {
    return {
      ok: false,
      code: 'LIA_OPS_SPOOF',
      message: 'Wallet LIA ops interdit en session utilisateur dApp.',
    }
  }
  return { ok: true }
}

export async function probeAccountCodeHash(
  address: string,
  apiBase = 'https://api.multiversx.com'
): Promise<ContractProbe> {
  try {
    const r = await fetch(`${apiBase.replace(/\/$/, '')}/accounts/${address}`)
    if (!r.ok) {
      return { address, codeHash: null, codeEmpty: true }
    }
    const j = (await r.json()) as { codeHash?: string | null }
    const codeHash = j.codeHash ?? null
    return {
      address,
      codeHash,
      codeEmpty: !codeHash,
    }
  } catch {
    return { address, codeHash: null, codeEmpty: true }
  }
}
