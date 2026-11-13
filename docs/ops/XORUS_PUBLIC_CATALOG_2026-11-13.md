# Catalogue public xOrus — 13 novembre 2026

Statut : pré-lancement uniquement. Cette PR améliore la lisibilité et la transparence du produit sans rendre un paiement possible.

## Trois ensembles différents

- Abonnements fiat : fiat_379 (3,79 € TTC/mois), fiat_579 (5,79 €), fiat_979 (9,79 €). Services sans wallet obligatoire et sans NFT. Aucun checkout ouvert.
- Axes xOrus : Pulse marchés (analysis:markets), Yield DeFi (analysis:defi), Sentinel risques (analysis:risk). Il n'y a pas encore de correspondance commerciale approuvée entre tarif EUR et droits de lecture privés ; scope_mapping_approved=false.
- Genesis NFT : plafonds cibles 33 / 22 / 11 EGLD, non payables. Les prix historiques relevés en contrat le 8 novembre ne constituent pas un cours actuel.

## Route et garde-fous

GET /v1/commercial/catalog fournit le catalogue côté serveur, public sans authentification ni données client. GET-only, sans query ni action PSP. Tout passe en sale_open=false, billing_checkout_enabled=false, mint_enabled=false. Une réponse mal formée ne valide jamais un achat.

Le client utilise VITE_ACCESS_API_BASE ou la base publique Render, lit sans cookies/bearer, no-store, délais bornés 6,5 s et validation stricte des 3 SKU. Si l'API est absente, le frontend affiche les objectifs historiques comme indicatifs et le statut indisponible.

Les trois domaines d'analyse illustrent le produit recherché ; aucun rapport premium ni licence fournisseur n'est présumé. La vente de données collectées est exclue du modèle.

## Bloquants de lancement

Contrôle des droits commerciaux des sources, production de véritables analyses dérivées, comptes email OTP réels, cible de base PostgreSQL certifiée avec backup/restauration et migrations autorisées, Stripe récurrent avec webhook signé, réconciliation de remboursements, affectation des avantages et quotas par niveau, conditions contractuelles et livraison vérifiée.

Aucun secret, migration, paiement, mint, ordre ou trading déclenché.