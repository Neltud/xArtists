# Matrice complète : chaque clic → implication → TX → risque

Date: 2026-08-03 · Mainnet only · Rappel **Pinata JWT = à finir plus tard** (secrets Vellum)

Légende risque : 🟢 bas · 🟡 moyen · 🟠 élevé · 🔴 critique (fonds / irréversible)

---

## 0. Shell global

| Clic | Implication | TX on-chain ? | Cohérence LT | Risque |
|------|-------------|---------------|--------------|--------|
| Logo → Home | Dashboard **LIA ops** (pas user) | Non | OK si bandeau clair | 🟢 |
| Connect | Session user ≠ LIA | Non (login) | Refus adresse LIA obligatoire | 🟡 session manuelle sans sign |
| Disconnect | Clear localStorage | Non | OK | 🟢 |
| Nav Studio/Gallery/… | Route SPA | Non | OK | 🟢 |
| Lien externe (xExchange, Hatom…) | Quitte dApp | Non | Isoler experimental | 🟢 |

---

## 1. Studio (artiste)

| Clic / étape | Implication | TX | LT | Risque |
|--------------|-------------|-----|----|--------|
| Choisir media type | State UI | Non | OK | 🟢 |
| Coller URI IPFS | Metadata locale | Non | **Pinata à brancher plus tard** | 🟡 URI invalide |
| YouTube URL | `external_url` only | Non | OK (pas storage) | 🟢 |
| Flag physical | Éligibilité rewards TRO | Non | Aligné rewards | 🟢 |
| « Publier / mint » guide | Affiche mxpy | **Oui côté ops** issue/mint | Pas one-click = OK v1 | 🟠 erreur encoding |
| Issue collection | Nouvelle col on-chain | System ESDT | Coût 0.05 EGLD+ | 🟠 |
| ESDTNFTCreate | NFT + URI | System | URI doit être pin permanente | 🟠 si URI centralisée |

**Processus décisionnel LIA :** ne pas auto-mint sans URI `ipfs://` validée + physical flag cohérent.

---

## 2. Galerie

| Clic | Implication | TX | LT | Risque |
|------|-------------|-----|----|--------|
| Ouvrir tile | Modal détail | Non | OK | 🟢 |
| Lien collection → market | Filter query | Non | OK | 🟢 |

---

## 3. Marketplace NFT

| Clic | Implication | TX data | Argent | LT | Risque |
|------|-------------|---------|--------|----|--------|
| **List / Sell** | Escrow 1 NFT sur SC | ESDTNFTTransfer → `listNft` | 0 EGLD + NFT | Listing ID à tracker | 🟠 mauvais SC/codehash |
| **Buy** | Paie prix ; reçoit NFT | `buyNft@id` + value | Prix → fee+royalty+seller | ID manuel = friction | 🔴 mauvais id / prix |
| **Place bid** | Escrow EGLD | `placeBid@id` + value | Bid locked | Codehash bid requis | 🔴 si SC sans bid |
| **Withdraw bid** | Récupère EGLD | `withdrawBid` | — | OK | 🟡 |
| **Accept bid** | Vente au bid | `acceptBid` | Split fee/royalty | Seller only | 🔴 |
| **Cancel listing** | NFT rendu + refund bid | `cancelListing` | — | OK | 🟡 |
| **Offer** | Message « use Bid » | **Aucune** | — | Cohérent | 🟢 |
| XOXNO / Explorer | Sortie | Non | — | OK | 🟢 |

**Optimisation LT :** indexer `listing_count` + events → supprimer saisie manuelle ID (P1).

---

## 4. Agents

| Clic | Implication | TX | Argent | LT | Risque |
|------|-------------|-----|--------|----|--------|
| Voir agent | Catalogue | Non | — | OK | 🟢 |
| **Buy agent** | `buyAgentAction` | EGLD | 97% seller / 3% SC | SC null = bloqué | 🔴 si SC live sans fulfillment |
| Post-buy | API key + badge + reçu | Mint badge (ops) | — | `fulfillment.py` | 🟡 clé non livrée |

**Décision LIA :** after buy event → fulfillment only if tx success confirmed (not mempool).

---

## 5. Trading / Board LIA

| Clic | Implication | TX | LT | Risque |
|------|-------------|-----|----|--------|
| Voir board | JSON seed/publish | Non | Publish cadence | 🟢 |
| Signaux arb | Info block-time | Non in-dApp | Pas HFT | 🟢 |
| Live trade LIA | Executor | **Oui PEM** | Gated flag | 🔴 capital LIA |

**Décision LIA :** `can_open_trade` + circuit breaker 3 fails → halt.

---

## 6. Portfolio / Wallet

| Clic | Implication | TX | LT | Risque |
|------|-------------|-----|----|--------|
| Portfolio | Stats **LIA** + scénarios | Non | Label ops | 🟢 si labels OK |
| Wallet « Mon wallet » | Scan adresse Connect | Non | OK | 🟢 |
| Wallet « LIA ops » | Scan protocole | Non | OK | 🟢 |
| MoonPay (mode LIA) | Fiat → **LIA** | Off-ramp provider | Explicit label | 🟡 user croit perso |

---

## 7. $TRO / DAO / Staking

| Clic | Implication | TX | LT | Risque |
|------|-------------|-----|----|--------|
| Voir $TRO | Prix / liens | Non | OK | 🟢 |
| Vote DAO UI | Affiche proposal | **TX si branché** | Souvent UI-only aujourd’hui | 🟡 fausse impression vote |
| Stake UI | Idem | Possible SC legacy | Vérifier endpoints | 🟠 |

**Décision LIA :** ne pas afficher bouton Vote actif tant que `sendTx` + ABI vote non testés (désactiver ou badge « lecture »).

---

## 8. Hatom / LP

| Clic | Implication | TX | LT | Risque |
|------|-------------|-----|----|--------|
| Pages info | Positions LIA / liens | Non in-dApp | Supply via Hatom app | 🟢 |
| Lien app.hatom | User quitte | Hatom | OK | 🟡 |

---

## 9. Tip

| Clic | Implication | TX | LT | Risque |
|------|-------------|-----|----|--------|
| Tip EGLD → LIA | Transfer user→LIA | EGLD transfer | Label destinataire | 🟡 |
| MoonPay | Fiat | Provider | OK | 🟢 |

---

## 10. Rewards $TRO créateurs (Vellum, pas clic user direct)

| Event | Implication | TX | Risque |
|-------|-------------|-----|--------|
| 1er mint physical | Queue 5 TRO | Transfer TRO live si flags | 🟠 pool/spam |
| 1re vente NFT | Queue 1 TRO | Idem | 🟠 |
| Pool 0 | Reject | Non | 🟢 |

---

## Cohérence long terme — verdict

| Domaine | Cohérent LT ? | Action |
|---------|---------------|--------|
| Séparation LIA / user | ✅ après fix labels | Maintenir |
| Market list/buy/bid | ⚠️ | Index listings + codehash |
| Agents | ⚠️ | Deploy + fulfillment |
| Signature | ⚠️ | WC E2E |
| Rewards first_sale | ✅ | Indexer ventes |
| Pinata | ⏳ **plus tard** | JWT Vellum |
| DAO vote | ⚠️ | Disable fake TX ou brancher |
| Live trading | ✅ gated | Rester paper |
| Un pipeline Pages | ✅ | Capitaliser |

---

## Processus décisionnels LIA (nouveaux / à tenir)

Voir `lia/decisions/policy.py` + tableau risques ci-dessous.
