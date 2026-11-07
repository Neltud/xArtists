#!/usr/bin/env node
/**
 * Strict, offline validation of unsigned role-grant REVIEW documents.
 * It never connects to a chain, reads a private key, signs or broadcasts.
 * Passing this check is NOT live readiness or an instruction to send.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Address } from '@multiversx/sdk-core'

const OWNER = 'erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g'
const SYSTEM = 'erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u'
const COLLECTIONS = ['XAIPLS-2cf72b','XAIYLD-987e24','XAISNT-3d8a6b']
const ROLES = ['ESDTRoleSetNewURI','ESDTRoleNFTUpdate']
const hex = text => Buffer.from(text, 'utf8').toString('hex')

export function validatePackRoleManifest(manifest) {
  const problems = []
  const check = (condition, code) => { if (!condition) problems.push(code) }
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest))
    return {ok:false, problems:['invalid_document'],status:'NO_GO_REVIEW_ONLY'}
  check(manifest.schemaVersion === 1, 'schema_mismatch')
  check(manifest.kind === 'xartists_pack_role_grant_unsigned_transactions', 'kind_mismatch')
  check(manifest.mode === 'REVIEW_ONLY_NOT_SIGNED_NOT_BROADCAST', 'mode_mismatch')
  check(manifest.network === 'multiversx-mainnet' && manifest.chainId === '1', 'wrong_network')
  check(manifest.sender === OWNER && manifest.roleRecipient === OWNER, 'wrong_owner_or_role_recipient')
  check(manifest.receiver === SYSTEM && manifest.value === '0', 'receiver_or_value_invalid')
  check(manifest.function === 'setSpecialRole', 'unexpected_operation')
  const ownerHex = Buffer.from(Address.newFromBech32(OWNER).getPublicKey()).toString('hex')
  check(manifest.roleRecipientHex === ownerHex, 'wrong_owner_public_key')
  check(manifest.encoding?.systemContractPubkey ===
    Buffer.from(Address.newFromBech32(SYSTEM).getPublicKey()).toString('hex'), 'system_pubkey_mismatch')
  check(manifest.encoding?.gasLimit === 60000000, 'gas_limit_mismatch')
  const roleRows = manifest.roles
  check(Array.isArray(roleRows) && roleRows.length === 2, 'roles_count_invalid')
  if (Array.isArray(roleRows)) {
    for (const [index, role] of ROLES.entries()) {
      check(roleRows[index]?.name === role && roleRows[index]?.hex === hex(role), 'wrong_role_' + index)
    }
  }
  const txs = manifest.transactions
  check(Array.isArray(txs) && txs.length === 3, 'transactions_count_invalid')
  if (Array.isArray(txs)) {
    for (const [index, collection] of COLLECTIONS.entries()) {
      const tx = txs[index]
      if (!tx || typeof tx !== 'object') { problems.push('missing_transaction_' + index); continue }
      const expected = ['setSpecialRole', hex(collection), ownerHex, ...ROLES.map(hex)].join('@')
      check(tx.order === index + 1 && tx.collection === collection, 'collection_or_order_' + index)
      check(tx.collectionHex === hex(collection) && tx.data === expected, 'payload_mismatch_' + index)
      check(tx.signed === false && tx.broadcast === false && tx.txHash === null, 'transaction_must_be_unsigned_' + index)
      check(!('nonce' in tx) && !('gasPrice' in tx) && !('signature' in tx), 'forbidden_transaction_field_' + index)
    }
  }
  return {
    ok:problems.length===0, problems,
    status:'NO_GO_REVIEW_ONLY',
    transactionsExpected:3, permissionsExpected:ROLES.length,
    signed:false, broadcast:false, liveRolesVerified:false, ipfsVerified:false,
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const path = process.argv[2]
  if (!path || process.argv.length !== 3) {
    console.error('Usage: node scripts/verify-pack-role-manifest.mjs <unsigned-manifest.json>')
    process.exitCode = 2
  } else {
    try {
      const data = JSON.parse(readFileSync(path, 'utf8'))
      const report = validatePackRoleManifest(data)
      process.stdout.write(JSON.stringify(report, null, 2) + '\n')
      if (!report.ok) process.exitCode = 1
    } catch {
      console.error('Unsigned manifest validation failed (no sensitive content printed).')
      process.exitCode = 1
    }
  }
}
