# Frontend — clarifications UX + lacunes

## Ajouté (bulles / guides)

| Composant | Rôle |
|-----------|------|
| `InfoTip` | Bouton « i » cliquable (mobile OK, pas hover-only) |
| `PageGuide` | Intro de page + liste de tips |
| `content/helpCopy.ts` | Textes centralisés (honnêtes) |

Pages branchées en priorité : **Dashboard**, **Wallet** (+ pattern réplicable).

À brancher de la même façon (1 ligne `<PageGuide page="…" />`) :

- `/portfolio` · `/trading` · `/marketplace` · `/agents` · `/gallery` · `/studio` · `/dao` · `/tro` · `/tip` · `/hatom` · `/ads` · `/editions` · `/soul-testnet`

---

## Lacunes / bugs connus (produit)

| Zone | État | Manque |
|------|------|--------|
| List/Buy/Bid NFT | bloqué | SC `codeHash` null |
| Buy agent | bloqué | agents_marketplace null |
| Vote DAO | UI only | pas de faux envoi TX |
| Listing ID manuel | ⚠️ | index events post-deploy |
| Board 404 Pages | en cours | `ensure_pages_data` + seeds docs/data |
| Signature | ⚠️ | sdk-dapp / extension user |
| Offer | absent | endpoint escrow dédié |
| Mission/Reserve | absents | wallets + split cash |
| LIA live | 0 | micro-trades d’abord |
| HF Hatom 999 | label | afficher N/A + tip |

---

## Messages à ne jamais afficher

- « Market live » sans `CODEHASH_OK`
- « Vote envoyé » sans tx hash
- Portfolio user = adresses LIA
- Performance LIA live sans flag + preuves
- $TRO comme cash treasury

---

## Suite UX recommandée

1. `<PageGuide />` sur chaque route restante  
2. Tips sur boutons List/Buy (disabled reason)  
3. Empty states galerie / board avec lien raw GitHub  
4. Rebuild Pages après merge  
