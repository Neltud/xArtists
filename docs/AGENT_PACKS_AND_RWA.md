# Packs IA (3 profils) · Parcours stake · Actifs RWA

## 1. Les trois packs (SKU commerciaux)

Les **6 modules** historiques (Trading, Marketplace, Yield, Security, RWA, DAO) = **cerveau interne LIA**.  
Les **3 packs vendus** = produits clairs pour l’utilisateur :

| Pack | Focus | Prix indicatif | Stratégies | Risque perçu |
|------|--------|----------------|------------|--------------|
| **Pulse** | Micro-arb, momentum, board | 5–15 € (défaut 12) | MICRO_ARB, MOMENTUM, MEAN_REV | medium |
| **Yield** | Hatom, LP, compound | 8–20 € (défaut 15) | YIELD, COMPOUND | lower |
| **Sentinel** | Défense, risk-off, veille | 10–25 € (défaut 18) | DEFENSE, SOCIAL_WATCH, ADVISOR | low |

- LIA **propose** le prix listé dans la fourchette (volatilité, demande, sleeve).  
- Achat = **NFT badge + slot + clé API limitée + droit de part de pool** — **pas** de rendement garanti.  
- **≠ GreenSmoke** (prévisions externes).

### Split pool packs (indicatif v1, BPS)

Pulse 40 % · Yield 35 % · Sentinel 25 % du *pack revenue pool* (fees packs + éventuel % PnL protocole voté DAO).

---

## 2. Parcours utilisateur (ordre strict)

```
1. Choisir Pulse | Yield | Sentinel
2. Buy on-chain (agents_marketplace) → NFT mint + reçu
3. Stake NFT → active le droit de part
4. [Option v1.5] Deposit tokens → escrow SC du pack (cap)
5. Epoch → claim share (user signe claim)
6. Unstake → redevient badge transferability rules
```

### Stake puis envoyer des tokens ?

| Modèle | Description | Verdict |
|--------|-------------|---------|
| **C — v1 recommandé** | Prix du pack = seul capital user ; part sur pool protocole | **Le plus impeccable** : pas de « fonds géré », UX simple |
| **B — v1.5** | Stake NFT + `deposit` escrow pack isolé | OK si SC dédié, caps, withdraw, jamais wallet LIA ops |
| **A — à éviter** | Envoi libre de tokens vers une adresse « agent » | Custody perception, mélange des soldes |

**Règle d’or UX** : chaque écran dit *où va l’argent* (seller / fee SC / escrow pack / treasury) avant la signature.

---

## 3. Actifs RWA intégrés au Market art

| Classe | TRO reward 1 max | Escrow |
|--------|------------------|--------|
| Œuvre physique | oui (vente) | oui P2 |
| Édition limitée | oui | oui P2 |
| Collectible phygital | oui | oui P2 |
| Média IPFS only | non | non |
| Certificat / provenance | non | optionnel |

Flux : Studio (`physical:true`) → Pinata → mint → list → buy → (P2) delivery/escrow status.  
`rwa_escrow_bridge` reste **null** jusqu’audit ; la dApp expose déjà la taxonomie et le parcours.

---

## 4. Réflexion produit (intensité)

1. **Séparer cerveau et SKU** : 3 packs évitent la paralysie du choix et le mélange GSN.  
2. **Capital user hors book LIA en v1** : on monétise le *droit d’accès / share de fees*, pas un mandat de gestion.  
3. **RWA = metadata d’abord** : le market art gagne en sérieux sans attendre le SC escrow.  
4. **Même language partout** : Buy → Stake → (Deposit) → Claim.  
5. **LIA prix dynamique** : oracles + demande packs ; bornes 5–25 € hardcodées produit.

---

*Implémentation front : `config/agentPacks.ts`, `config/rwaAssets.ts`, grilles + journey sur `/agents` et market.*
