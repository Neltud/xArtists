/** Soul Protocol — experimental only (not in primary nav) */
export const SOUL = {
  /** No public app link until verified — avoid 404/phishing risk */
  appUrl: null as string | null,
  status: 'experimental' as const,
  mxNative: false,
  testnets: [
    { id: 11155111, name: 'Ethereum Sepolia' },
    { id: 84532, name: 'Base Sepolia' },
    { id: 421614, name: 'Arbitrum Sepolia' },
  ],
  disclaimer:
    'Experimental integration. Not in primary navigation. No mainnet user funds. Third-party risk. Not financial advice.',
}
