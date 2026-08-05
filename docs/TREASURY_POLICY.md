# Treasury Policy — Fondation décentralisée xArtists

**Version** : 0.1 · **Réseau** : MultiversX mainnet · **Statut** : policy produit (à ratifier DAO / ops)

**Principe** : collecte = perf LIA + fees market + tips + services · **pas de vente de parts de fonds**.

---

## 1. Wallets nommés

| Rôle | Adresse | Usage |
|------|---------|--------|
| **LIA Ops / Protocol** | `erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6` | Exécution LIA, balances affichées Dashboard « protocole » — **jamais** login user |
| **Treasury Mission** | `[erd1… À CRÉER / multisig]` | Grants, acquisitions art, drops fondation |
| **Treasury Reserve** | `[erd1… À CRÉER / multisig]` | Runway, drawdown, imprévus |
| **Fee Collector (SC)** | SC marketplace (après deploy live) | Accumule fees on-chain → withdraw vers split |
| **User Connect** | Wallet de l’utilisateur | Tips / achats — hors treasury |

Tant que Mission / Reserve n’existent pas : **tout est encore concentré sur LIA Ops** = dette de transparence (à corriger en priorité).

Snapshot on-chain (août 2026) : LIA Ops ≈ **0,66 EGLD** + stock $TRO + NFT ; contrats market/staking/governance **vides** (non opérationnels pour collecter des fees).

---

## 2. Sources de collecte & split

| Source | Condition | Split indicatif (brut reçu) |
|--------|-----------|------------------------------|
| **Fees marketplace** | SC live + `codeHash` ≠ null | 40 % Mission · 30 % Reserve · 20 % Ops (gas/dev) · 10 % incentives listings |
| **Tips** | Explicit « don protocole / mission » | 70 % Mission · 20 % Reserve · 10 % Ops |
| **Pub enchères (ads)** | Paiement memo / SC V2 | 50 % Mission · 25 % Reserve · 15 % Ops · 10 % stakers P2 |
| **PnL LIA (live)** | `LIA_LIVE_TRADING=1` + gates micro-proof | 30 % Mission · 40 % Reserve · 20 % Ops · 10 % growth/MM |
| **PnL LIA (paper)** | `LIA_LIVE_TRADING=0` | **0 cash** — rapport simulé seulement |
| **Services** (abo, studio, packs agents) | Facturation claire | 50 % Ops · 30 % Mission · 20 % Reserve |

Pourcentages = **paramètres DAO** (modifiables par vote, pas par LIA seule).

---

## 3. Qui peut bouger les fonds

| Action | Qui | Comment |
|--------|-----|---------|
| Exécution trading / yield LIA | LIA (policy + kill switch) | Dans limites mandat ; report hash / tx |
| Withdraw fees SC market | Owner SC / multisig ops | Puis split selon §2 sous **7 jours** |
| Grants / achat art | Multisig Mission ou vote DAO | Mémo public (artiste, montant, objectif) |
| Transfert Reserve → Ops | Multisig + seuil | Au-delà de X EGLD : vote DAO |
| Mint $TRO | **Pas** LIA / **pas** Vellum | Uniquement governance humaine + règles supply |
| Dépenser tip user | N/A | Tip déjà reçu en treasury selon §2 |

**LIA ne signe pas les grants Mission.** Le DAO $TRO paramètre fees & splits ; il ne « gère » pas le wallet user.

---

## 4. Rôle DAO $TRO (treasury)

- Fixer % fee market et % split §2
- Whitelist collections / éligibilité grants
- Approuver sorties Reserve > seuil
- **Ne pas** promettre yield sur tip ou stake = perf LIA
- **Ne pas** traiter $TRO comme share du fonds

**Supply** : aligné produit actuel (**max 500 000 TRO**) sauf vote documenté contraire.

---

## 5. Reporting (crédibilité)

| Fréquence | Contenu |
|-----------|---------|
| Continu | Adresses §1 publiques (README + `/dao` ou wallet protocole) |
| Hebdo (auto) | Soldes EGLD / $TRO / NFTs treasury ; fees SC si live |
| Mensuel | PnL LIA paper **ou** live (séparés) ; grants payés ; % respect du split |
| Incident | Toute perte > seuil Reserve → post-mortem public |

**Dashboard** : labels « LIA Ops » vs « Treasury Mission » vs « Mon wallet ».

---

## 6. Conditions d’activation

| Module | Avant activation cash |
|--------|----------------------|
| Fees market | Deploy SC + `codeHash` + bandeau UI retiré |
| PnL LIA live | Paper stable + gates + `LIA_LIVE_TRADING=1` explicite |
| Grants visibles | ≥1 drop ou grant publié avec tx |
| Split auto | Script / SC sink ou procédure ops datée ≤7 j |
| Deploy SC | Solde LIA Ops **rechargé** si simulation > marge (0,66 EGLD = serré pour 2 deploys) |

---

## 7. Synthèse

La fondation se finance par **l’usage** (fees, tips, ads, services) et, le cas échéant, par une **LIA auditable** ; la DAO fixe les règles de partage ; des wallets publics et des rapports prouvent que ce n’est **ni un bot opaque ni un fonds déguisé**.

---

## Prochaines actions (ordre)

1. Créer 2 adresses (ou multisig) **Mission + Reserve** · les publier ici
2. Mettre à jour dApp : labels + liens explorer
3. **Market live** → brancher fee → premier split réel
4. Ratifier cette policy (commit + vote DAO informel ou on-chain)
5. Job hebdo → `data/treasury_snapshot.json` (soldes LIA Ops + SC fees)

Remplacer `[erd1… À CRÉER]` dès que les wallets existent.
