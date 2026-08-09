/** Soul Protocol — pre-mainnet only (not in primary nav) */
export const SOUL = {
  appUrl: null as string | null,
  status: 'pre-mainnet' as const,
  mxNative: false,
  testnets: [
    { id: 11155111, name: 'Ethereum Sepolia' },
    { id: 84532, name: 'Base Sepolia' },
    { id: 421614, name: 'Arbitrum Sepolia' },
  ],
  disclaimer:
    'Pre-mainnet integration. Not in primary navigation. No mainnet user funds. Third-party risk. Not financial advice.',
}
