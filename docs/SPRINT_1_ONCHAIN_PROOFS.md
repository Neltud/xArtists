# Sprint 1 — Preuves on-chain & verrouillage technique

**Statut** : PRÊT À DÉMARRER (après Sprint 0 vert)  
**Dépendance** : Sprint 0 criteria met (branch protection, environment production, CODEOWNERS, keys rotated)

## Objectifs

1. Build reproductible + hash épinglé
2. Vérification codeHash on-chain vs hash épinglé
3. Owner SC → multisig + timelock
4. Micro-preuve d’achat pack complet documentée
5. Pause d’urgence testée
6. Politique de prix explicite + CID IPFS définitifs

## Checklist détaillée

### 1.1 Build & hash
- [ ] CI produit un artefact wasm déterministe
- [ ] Hash SHA-256 du bytecode épinglé dans un fichier versionné (`contracts/*/CODEHASH.md` ou data/contracts.json)
- [ ] Job CI échoue si le hash on-chain ne correspond pas (optionnel post-deploy)

### 1.2 Owner & upgrade control
- [ ] Identifier l’owner actuel de chaque SC critique (agents-marketplace, nft-marketplace, treasury, etc.)
- [ ] Migrer ownership vers multisig + timelock (ou documenter le plan et le délai)
- [ ] Vérifier que l’upgrade n’est possible que via le chemin contrôlé

### 1.3 Micro-preuve d’achat (plus petit pack = Sentinel 50 €)
- [ ] Quote Rule 1 validée
- [ ] Paiement test (sandbox ou réel contrôlé)
- [ ] NFT reçu dans le wallet acheteur / custody
- [ ] Supply débitée
- [ ] Fonds arrivés dans le bucket attendu
- [ ] Annulation / remboursement testé et journalisé

### 1.4 Pause d’urgence
- [ ] Fonction pause/unpause présente et testée
- [ ] Exercice documenté (qui, quand, résultat)

### 1.5 Prix & IPFS
- [ ] Prix packs verrouillés (110/75/50 € Rule 1)
- [ ] CID IPFS définitifs (plus de temporaires)

## Critère de sortie

- Rapport d’achat réel de bout en bout (screenshot + tx hashes + balances)
- Pause testée
- codeHash épinglé en CI
- Owner plan multisig/timelock documenté ou exécuté

## Doctrine

Paper LIA maintenu. Aucun switch live. No commercial GO.
