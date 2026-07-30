/** Soul Protocol — testnet only */
export const SOUL = {
  appUrl: "https://app.soul.io",
  status: "testnet" as const,
  mxNative: false,
  testnets: [
    { id: 11155111, name: "Ethereum Sepolia" },
    { id: 84532, name: "Base Sepolia" },
    { id: 421614, name: "Arbitrum Sepolia" },
  ],
  disclaimer:
    "Experimental integration. Use testnet networks only. Third-party protocol risk applies. Not financial advice.",
};
