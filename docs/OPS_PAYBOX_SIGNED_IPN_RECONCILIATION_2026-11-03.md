# PayBox — preuve d'intégration IPN signé + PostgreSQL (3 novembre 2026)

## Statut des preuves : simulation cryptographique locale seulement

La suite `services/access-api/tests/payboxSignedIpnPostgres.test.mjs` utilise
une paire RSA-2048 **éphémère de test**, une API HTTP localhost et une base
PostgreSQL 16 jetable `xartists_ipn_probe`. Un nouveau jeu d'identifiants
fictifs est généré à chaque exécution. Le test refuse tout hôte de base
autre que `localhost`/`127.0.0.1`, tout autre nom de base et toute
exécution sans `ALLOW_EPHEMERAL_MINT_PG_TEST=1`.

**Aucun vrai prestataire PayBox, carte, wallet ou contrat blockchain n'est
contacté.** Cela ne constitue pas un paiement PSP S1 réel.

## Comportements vérifiés par la CI

1. Une commande fictive est créée en base puis un **callback HTTP POST**
   form-encoded signé RSA-SHA256 est envoyé au serveur Node séparé.
2. Les requêtes sans signature, au montant altéré, pour mauvais identifiant
   marchand ou avec sources query/body contradictoires sont rejetées.
3. Un callback « payé » signé mais **sans `idtrans`** est désormais rejeté
   avant toute mutation de commande : le rattachement au PSP exige un ID
   transaction. Un identifiant signé et non vide est nécessaire.
4. Deux callbacks valides en concurrence ne créent qu'**une transition
   paiement** ; le deuxième est un rejeu reconnu. Le journal DB conserve
   le PSP transaction ID, les compteurs d'IPN et le `status=paid`.
5. Un même identifiant de transaction PSP ne peut pas confirmer une
   seconde commande d'un montant différent.
6. Après redémarrage du serveur Node, un callback valide répété est
   reconnu comme doublon grâce aux données PostgreSQL persistées.
7. Le paiement ne donne **aucune preuve de livraison NFT** :
   `delivery=pending`, `delivery_verified=false`,
   `delivered_at=null`, `mint_status=awaiting_dispatch`.
8. Le checkout PayBox, le dispatch NFT, le mint réel et le trading LIA
   sont tous désactivés dans le processus de test.

## Prérequis CI et séparation stricte

Le job GitHub Actions `Mint Postgres idempotency + order-store readiness`
démarre un conteneur PostgreSQL 16 temporaire. Il conserve ses deux
preuves précédentes, puis crée la base dédiée `xartists_ipn_probe`.
Les valeurs de connexion n'accèdent qu'au PostgreSQL localhost jetable,
sans secret Render ou Neon. Les clés RSA de test sont générées en mémoire
pendant l'exécution.

La CI doit réussir avant toute fusion, et l'API Render doit rester
`PAYBOX_CHECKOUT_ENABLED=0`, `MINT_DISPATCH_ENABLED=0`,
`MINT_DRY_RUN=1`, `MINT_LIVE_ENABLED=0`, `LIA_LIVE_TRADING=0`.

## Ce qui reste NO-GO

- Vérification du **vrai callback RSA du PSP** et du certificat de confiance
  en environnement PayBox préproduction autorisé.
- Confirmation bancaire réelle S1 et rapprochement PSP↔commande en lecture
  opérateur, sans fuite de données acheteurs.
- Résilience des callbacks réseau, réponses 5xx, timeout, retries PSP,
  reprise après incident et observation continue.
- Transaction on-chain S2 attestant NFT, identifiant, hash, destinataire
  réellement propriétaire et politique de remboursement.
- Procédure opérateur de remboursement, arbitrage des paiements tardifs
  et revue indépendante du mode mainnet.

Suivi : [issue #281](https://github.com/Neltud/xArtists/issues/281).
Les preuves automatiques sécurisent les transitions du logiciel ;
**elles ne remplacent pas l'approbation humaine d'un test de paiement réel.**
