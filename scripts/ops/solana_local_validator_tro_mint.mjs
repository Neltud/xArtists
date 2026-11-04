/**
 * Disposable local-ledger SPL mint account: 6 decimals, ZERO units issued.
 * Not a public Solana token, reserve proof, bridge or production authority design.
 * No user key, wallet, mainnet address or RPC environment override is consumed.
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { writeFileSync, appendFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

export const LOCAL_RPC = 'http://127.0.0.1:8899'
export function localMintEnvironment() {
  assert.equal(process.env.XARTISTS_ALLOW_LOCAL_TRO_MINT, '1', 'explicit LOCAL mint proof opt-in required')
  return LOCAL_RPC
}

export async function proveLocalTroMint() {
  const endpoint = localMintEnvironment() // Reject before SDK load or any network request.
  const require = createRequire(import.meta.url)
  const { Connection, Keypair, LAMPORTS_PER_SOL } = require('@solana/web3.js')
  const { createMint, getMint, TOKEN_PROGRAM_ID } = require('@solana/spl-token')
  const connection = new Connection(endpoint, { commitment: 'confirmed', disableRetryOnRateLimit: true })
  assert.equal(connection.rpcEndpoint, LOCAL_RPC)
  const payer = Keypair.generate(), authority = Keypair.generate(), mintKey = Keypair.generate()
  const genesisHash = await connection.getGenesisHash()
  assert.equal(await connection.getBalance(payer.publicKey), 0, 'Local payer must be a fresh unfunded key')
  await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL)
  let funded = false
  for (let attempt = 0; attempt < 40; attempt++) {
    if (await connection.getBalance(payer.publicKey) >= LAMPORTS_PER_SOL) { funded = true; break }
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  assert(funded, 'Disposable local faucet did not fund the fresh local payer')
  const mint = await createMint(connection, payer, authority.publicKey, null, 6, mintKey,
    { commitment: 'confirmed', preflightCommitment: 'confirmed', skipPreflight: false }, TOKEN_PROGRAM_ID)
  const state = await getMint(connection, mint, 'confirmed', TOKEN_PROGRAM_ID)
  assert.equal(state.decimals, 6)
  assert.equal(state.supply, 0n, 'No unbacked units may be issued by this prototype')
  assert.equal(state.freezeAuthority, null)
  assert(state.mintAuthority?.equals(authority.publicKey))
  const account = await connection.getAccountInfo(mint)
  assert(account?.owner.equals(TOKEN_PROGRAM_ID))
  const signatures = await connection.getSignaturesForAddress(mint, { limit: 1 })
  assert.equal(signatures.length, 1)
  assert.equal(signatures[0].err, null)
  const transaction = await connection.getTransaction(signatures[0].signature,
    { commitment: 'confirmed', maxSupportedTransactionVersion: 0 })
  assert(transaction?.meta && transaction.meta.err === null, 'Local mint creation must be confirmed')
  const proof = {
    schema: 'xartists-local-zero-supply-mint/v1', network: 'disposable-local-validator',
    warning: 'LOCAL ONLY — NOT a public Solana deployment, backing proof or commercial launch',
    rpc: LOCAL_RPC, genesisHash, localMint: mint.toBase58(),
    localCreationSignature: signatures[0].signature, tokenProgram: TOKEN_PROGRAM_ID.toBase58(),
    originIdentifier: 'TRO-94c925', targetModel: 'backed-1:1', decimals: state.decimals,
    supplyAtomic: state.supply.toString(), freezeAuthority: null,
    authorityModel: 'ephemeral test key; NOT a production issuance authority',
    publicSolanaMint: null, bridgeEnabled: false, saleEnabled: false,
  }
  const json = JSON.stringify(proof, null, 2) + '\n'
  if (process.env.XARTISTS_LOCAL_TRO_PROOF) writeFileSync(process.env.XARTISTS_LOCAL_TRO_PROOF, json)
  console.log(json)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY,
    '\nSPL mint account verified on **disposable local validator only**: 6 decimals, **0 units**. ' +
    'No public TRO mint, reserves or bridge attested. Production authorities remain undecided.\n')
  return proof
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  proveLocalTroMint().catch(error => {
    console.error('LOCAL_TRO_MINT_BLOCKED: ' + String(error.message).slice(0, 220))
    process.exitCode = 1
  })
}
