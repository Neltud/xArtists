# Sprint 2 — État de validation commerciale

> **Statut au 1er novembre 2026 : NO-GO commercial.** Cette page décrit des contrôles à valider ; elle ne certifie aucun paiement fiat réalisé.

## Avancement vérifiable

* Micro-preuve A : achat `buyPack` Pulse on-chain documenté dans [PR #238](https://github.com/Neltud/xArtists/pull/238).
* Variante B : paiement réel Sentinel 50 € **non encore validé** dans la [carte opérateur](https://github.com/Neltud/xArtists/blob/main/docs/OPERATOR_CARD_MICRO_PROOF_B.md).
* Vérification IPN signé, attribution des droits et remboursement : **preuves attendues**.
* Trading LIA : mode paper ; aucun feu vert live associé au lancement commercial.

## Conditions de sortie

1. Un opérateur autorisé exécute un paiement contrôlé de 50 € et conserve une référence de commande expurgée des données sensibles.
2. Le serveur vérifie la signature IPN, l'état payé et l'idempotence ; aucune attribution en cas de signature invalide.
3. Le droit Sentinel est visible pour le bon acheteur ; absence de double attribution.
4. Un remboursement est exécuté et rapproché ; le comportement du droit après remboursement est vérifié selon les CGV.
5. Les mentions légales, CGV, politique de confidentialité et communications marketing sont revues et approuvées.
6. Les contrôles CI et le journal des preuves sont examinés avant toute décision GO.

## Offres distinctes

**Packs IA Pulse, Yield, Sentinel** : achat unique, en crypto ou fiat, NFT MultiversX en édition limitée inclus ; aucun abonnement ni expiration annuelle des droits NFT annoncés. Les conditions exactes d'accès et de remboursement restent régies par les CGV applicables.

**Whop xArtists** : abonnement mensuel distinct donnant accès aux produits et services du plan souscrit. Un abonnement Whop ne doit pas être présenté comme une obligation pour posséder un pack IA.

## Transparence

La dApp et ses modules expérimentaux ne garantissent aucun rendement financier. Le statut de conformité ou de production ne doit pas être déduit d'une démonstration technique isolée.

Sources : [Sprint 2 conformité](https://github.com/Neltud/xArtists/blob/main/docs/SPRINT_2_COMPLIANCE.md) · [Carte PayBox B](https://github.com/Neltud/xArtists/blob/main/docs/OPERATOR_CARD_MICRO_PROOF_B.md).
