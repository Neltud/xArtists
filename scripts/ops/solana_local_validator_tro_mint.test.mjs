import test from 'node:test'
import assert from 'node:assert/strict'
import { localMintEnvironment, proveLocalTroMint, LOCAL_RPC } from './solana_local_validator_tro_mint.mjs'

test('default and invalid local opt-ins fail before dependencies, keys or network access', async () => {
  const previous = process.env.XARTISTS_ALLOW_LOCAL_TRO_MINT
  try {
    for (const value of [undefined, '0', 'true', 'mainnet']) {
      if (value === undefined) delete process.env.XARTISTS_ALLOW_LOCAL_TRO_MINT
      else process.env.XARTISTS_ALLOW_LOCAL_TRO_MINT = value
      await assert.rejects(proveLocalTroMint(), /explicit LOCAL mint proof opt-in required/)
    }
  } finally {
    if (previous === undefined) delete process.env.XARTISTS_ALLOW_LOCAL_TRO_MINT
    else process.env.XARTISTS_ALLOW_LOCAL_TRO_MINT = previous
  }
})

test('public RPC environment overrides cannot redirect the local prototype', () => {
  const previous = { opt: process.env.XARTISTS_ALLOW_LOCAL_TRO_MINT, rpc: process.env.SOLANA_RPC_URL }
  try {
    process.env.XARTISTS_ALLOW_LOCAL_TRO_MINT = '1'
    process.env.SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com'
    assert.equal(localMintEnvironment(), LOCAL_RPC)
    assert.equal(new URL(localMintEnvironment()).hostname, '127.0.0.1')
  } finally {
    if (previous.opt === undefined) delete process.env.XARTISTS_ALLOW_LOCAL_TRO_MINT
    else process.env.XARTISTS_ALLOW_LOCAL_TRO_MINT = previous.opt
    if (previous.rpc === undefined) delete process.env.SOLANA_RPC_URL
    else process.env.SOLANA_RPC_URL = previous.rpc
  }
})
