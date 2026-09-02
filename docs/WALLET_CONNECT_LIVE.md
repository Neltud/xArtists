# Wallet connect live — xArtists

## Flux actifs

| Méthode | Live ? | Signature TX |
|---------|--------|----------------|
| **Web Wallet** redirect | Oui (adresse de retour) | Via wallet web si flow TX |
| **xPortal** deep link | Ouvre l’app | Pairing WC complet = sdk-dapp login |
| **Extension** DeFi | Oui si installée | Oui |
| **Coller erd1** | Lecture seule | Non |

## Technique

- `MxDappProvider` monté dans `main.tsx`
- Callback : `https://neltud.github.io/xArtists/?address=erd1…`
- `WalletContext` parse `search` + hash query
- WC Project ID dans `config/sdkDapp.ts` (allowlist domain Pages)

## Test

1. /#/wallet → **Web Wallet — connexion live**
2. Login wallet.multiversx.com
3. Retour Pages → adresse affichée + localStorage
4. Déconnecter → reconnecter
