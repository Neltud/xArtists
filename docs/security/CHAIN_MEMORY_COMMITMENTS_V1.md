# xArtists — mémoire vérifiable, étape 1 : preuves locales

**6 novembre 2026 — statut : hors chaîne, lecture seule, aucun ancrage réel.**

La première brique de l'issue #418 fournit des engagements cryptographiques et des preuves de présence de données, sans clé, sans transaction et sans activation de LIA.

## Ce qui est implémenté

- `lia/memory/anchor_proofs.py` calcule des empreintes SHA-256 canonisées avec séparation de domaine entre événement, nœud Merkle et candidat d'ancrage.
- Le schéma d'événement est strict : version, famille (`rights`, `provenance`, `agent_signal`, `payment`, `delivery`, `media`), réseau, trois empreintes hexadécimales et horodatage source.
- Les lots de 1 à 1 024 événements produisent une racine Merkle déterministe. Les événements dupliqués dans un lot sont refusés. Les preuves d'inclusion vérifient les positions des feuilles et les nœuds des niveaux impairs.
- `anchor_candidate` prépare une enveloppe avec numéro de séquence, racine précédente, réseau de destination, racine et empreinte du candidat. Son état est **`unanchored` et `is_onchain_verified=false`**, toujours.
- Dix tests locaux hors ligne couvrent mutations, lots impairs, chemins invalides, champs supplémentaires, doublons et mauvaises destinations.

## Confidentialité

Le schéma n'accepte aucun texte de droits d'auteur, mail, token OAuth, pièce d'identité, reçu bancaire, image ou dossier utilisateur dans l'événement lui-même. **Attention : hacher directement une information personnelle de faible entropie ne la rend pas anonyme**. Les applications devront utiliser des identifiants aléatoires ou une stratégie HMAC à clé sécurisée hors chaîne, et conserver les contenus chiffrés avec contrôle d'accès et durée de rétention.

## Ce qui manque pour une mémoire réellement ancrée

1. Stockage append-only durable, transactions SQL, isolation multi-tenant et contrôle des séquences précédentes.
2. Vérification indépendante de la provenance des événements : signer un lot ou prouver un hash ne confirme ni propriété intellectuelle, ni paiement, ni livraison.
3. Contrat ou méthode d'ancrage vérifiés, chain ID, rôle de signature, frais maximum, protection contre rejeu et validation de finalité.
4. Verificateur de reçu réseau en lecture seule, de la bonne adresse/du bon codehash et des réorganisations.
5. Revue juridique/sécurité avant testnet et **autorisation explicite séparée** avant toute transaction mainnet.

Le module actuel `lia/memory/onchain_memory.py` reste un **cache local dérivé des transactions publiques**, pas une base de données immuable on-chain. Ne jamais afficher « vérifié sur chaîne », « paiement confirmé », « NFT livré » ou « agent en direct » sur la seule base d'une preuve d'inclusion locale.

## Tester

```bash
python -m unittest discover -s lia/memory -p 'test_anchor_proofs.py' -v
```

Référence : #418. Aucun flag de trading, mint, paiement ou bridge modifié.
