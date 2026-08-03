/**
 * Inject window.__xartistsSendTx for useSendTransaction.
 * Tries sdk-dapp sendTransactions, then extension provider, else clear error.
 */

export type TxLike = {
  receiver?: string
  value?: string
  gasLimit?: number | string
  data?: string
  chainID?: string
}

export type DisplayInfo = {
  processingMessage?: string
  successMessage?: string
  errorMessage?: string
}

declare global {
  interface Window {
    __xartistsSendTx?: (
      txs: TxLike[],
      info?: DisplayInfo
    ) => Promise<{ sessionId?: string }>
    elrondWallet?: { signTransaction?: (tx: unknown) => Promise<unknown> }
    multiversxWallet?: { signTransaction?: (tx: unknown) => Promise<unknown> }
  }
}

function normalizeTx(t: TxLike) {
  return {
    receiver: t.receiver || '',
    value: t.value || '0',
    gasLimit: String(t.gasLimit ?? 10_000_000),
    data: t.data || '',
    chainID: t.chainID || '1',
  }
}

async function trySdkDappSend(txs: TxLike[], info?: DisplayInfo) {
  try {
    // Dynamic import — may fail if sdk-dapp tree-shaken differently
    const mod = await import('@multiversx/sdk-dapp/services/transactions/sendTransactions')
    const sendTransactions =
      (mod as { sendTransactions?: Function }).sendTransactions ||
      (mod as { default?: Function }).default
    if (typeof sendTransactions !== 'function') return null
    const res = await sendTransactions({
      transactions: txs.map(normalizeTx),
      transactionsDisplayInfo: {
        processingMessage: info?.processingMessage || 'Processing…',
        successMessage: info?.successMessage || 'Success',
        errorMessage: info?.errorMessage || 'Failed',
      },
    })
    return { sessionId: String(res?.sessionId ?? res ?? 'sdk-dapp') }
  } catch {
    return null
  }
}

async function tryExtensionSign(txs: TxLike[]) {
  const provider = window.multiversxWallet || window.elrondWallet
  if (!provider?.signTransaction) {
    throw new Error(
      'Aucune méthode de signature — installe MultiversX DeFi Wallet ou configure sdk-dapp DappProvider + login'
    )
  }
  // Extension APIs vary; pass first tx shape
  const signed = await provider.signTransaction(normalizeTx(txs[0]))
  return { sessionId: 'extension-' + Date.now(), signed }
}

/** Call once at app boot */
export function bootstrapSendTx() {
  if (typeof window === 'undefined') return
  if (typeof window.__xartistsSendTx === 'function') return

  window.__xartistsSendTx = async (txs, info) => {
    if (!txs?.length) throw new Error('No transactions')
    const viaSdk = await trySdkDappSend(txs, info)
    if (viaSdk) return viaSdk
    const viaExt = await tryExtensionSign(txs)
    return { sessionId: viaExt.sessionId }
  }
}
