---
hidden: true
noIndex: true
---

# Produits séparés · Parcours · Sécurité

## Deux produits (ne pas confondre dans l’UI)

| Produit                  | Qui                    | Vente                 | Fonds              |
| ------------------------ | ---------------------- | --------------------- | ------------------ |
| **LIA Vellum xArtists**  | Protocole              | Pas un pack user      | Book pyramides LIA |
| **Sub-agent NFT limité** | Créé via prompt, vendu | Édition limitée (cap) | Stake owner isolé  |

Labels UI recommandés : « LIA Protocol Board » vs « Agent Pack (limited NFT) ».

## Parcours optimisé

### Collectionneur / acheteur

1. Persona → Agent Packs
2. Pay **EGLD** (SC) ou **Stripe / MoonPay / xMoney**
3. Receive badge NFT + API key once
4. Optional **escrow stake** starting funds
5. agent\_live opt-in (key cannot sign)

### Créateur Studio

1. Connect user wallet
2. Pin IPFS
3. Collection → mint art
4. List when marketplace live
5. Optional: create limited agent-NFT series

Gates SC : bannières « non déployé » tant que codeHash null.

## Stripe

`lia/payments/stripe_onramp.py` — Checkout session ; secrets `STRIPE_*` backend only.\
Webhook → `mark_paid_from_webhook` → on-chain fulfillment.

## Escrow

SC `contracts/agent-stake-escrow` + mirror `lia/agents/escrow_logic.py`.\
openStake / setAgentLive / closeStake · owner ≠ LIA wallet.

## Matrice sécurité (vérifier)

| Contrôle                                     | Statut                      |
| -------------------------------------------- | --------------------------- |
| Wallet user ≠ LIA                            | Enforce Connect + isolation |
| API key hash-only + scopes read              | OK module                   |
| Pas de PEM dans packs                        | OK                          |
| Social cap 0.15                              | OK                          |
| SC placeholder no funds                      | OK contracts.json           |
| Stripe secret server-side                    | À configurer Vellum         |
| CEI + pause market SC                        | Code agents-marketplace     |
| LIA\_LIVE\_TRADING=0 défaut                  | Policy                      |
| agent\_live défaut false                     | Escrow + stake              |
| Fiat → on-chain seulement après paid webhook | Process                     |

## Tests manuels parcours

1. Studio steps with wallet off → blocked flags
2. create\_checkout\_intent without STRIPE key → needs\_secret
3. mirror\_open with LIA address → error
4. fulfill\_purchase → key once + rights
5. Buy agent UI still blocked if agents\_marketplace null
