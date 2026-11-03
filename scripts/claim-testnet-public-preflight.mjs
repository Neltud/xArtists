#!/usr/bin/env node
// Public network READ-ONLY verification. Never signs, deploys, or mints.
import { verifyPublicTestnetNetworkPreflight } from '../services/access-api/src/claimTestnetNetworkPreflight.mjs'

try {
  const result = await verifyPublicTestnetNetworkPreflight()
  // Public output: no wallet addresses, keys or credentials.
  process.stdout.write(JSON.stringify({
    result: 'NETWORK_READ_ONLY_PREFLIGHT_OK',
    testnet_chain_id: result.testnet_chain_id,
    mainnet_reference_chain_id: result.mainnet_chain_id,
    network_identity_assessed: 'public_gateway_only',
    sc_runtime_identity_verified: false,
    transaction_sent: false,
    deploy_authorized: false,
    checkout_or_mint_enabled: false,
  }, null, 2) + '\n')
} catch (error) {
  const reason = error?.code === 'XA_TESTNET_PREFLIGHT_DENIED'
    ? String(error.message).slice(0, 180) : 'network_unavailable'
  process.stderr.write('NETWORK_PREFLIGHT_DENIED: ' + reason + '\n')
  process.exitCode = 1
}
