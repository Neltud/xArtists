# Sovereign EVM — référence (non-prod MVX)

Artefacts joints (Foundry / Sepolia) :

| Contrat | Rôle |
|---------|------|
| TRO_Master | ERC20 mint owner |
| Sovereign_Governance | vote balanceOf TRO |
| Marketplace_Escrow | listing + lock ETH |

Deploy script : `DeploySovereignCore` + `forge script`.

**xArtists production path reste MultiversX** (sdk-dapp, agents SC Rust).

Ne jamais committer `.env` avec PRIVATE_KEY / Alchemy keys.

UI Identity / LIA_Monitor (Next-style) déjà mappés en Vite :
`PaperSoulScore`, `LiaMonitor`, Intent bar — voir `SOVEREIGN_INTEGRATION_MATRIX.md`.
