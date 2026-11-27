---
hidden: true
noIndex: true
---

# xArtists Global — architecture des paiements internationaux

Décision produit du 27 novembre 2026 : expérience internationale, compte utilisateur simple, wallet MultiversX et Solana, paiements traditionnels et crypto, puis comptes et cartes via partenaires. Inspiration ergonomique de MetaWin, sans reprendre les jeux d'argent ni mélanger leurs fonds avec le commerce artistique. Aucun agrément, accord de partenaire ou paiement réel n'est déduit de cette décision.

## Principes non négociables

- Une seule navigation Wallet / Marketplace / Studio / Art World / xOrus / Gouvernance. Pay est une capacité du Wallet et du checkout, pas un nouveau module de navigation.
- Affichage EUR/USD/GBP comme cible initiale, distinct du solde disponible, du prix contractuel et de la devise réellement facturée. Langue, résidence, pays d'éligibilité et devise indépendants. Pas de taux fictif ; devise et montant exacts avant consentement. Les unités EGLD et SOL restent propres à leurs chaînes.
- Une carte de paiement ne crédite pas automatiquement un compte ; un onramp n'est pas un achat NFT ; une facture réglée ne vaut pas livraison NFT ; un retour navigateur ne vaut jamais preuve.
- xArtists ne garde ni fonds clients ni clés privées dans ce modèle. Un futur compte de paiement et une carte sont des services du partenaire agréé, non des promesses bancaires xArtists.
- Aucun checkout en production sans approbation explicite du prestataire pour l'activité exacte. Les NFT secondaires, crypto, jeux et analyses financières doivent faire l'objet d'une qualification distincte, jamais d'un contournement de classification.
- Ne pas introduire de service payant ou de stockage de données KYC / PAN / CVV chez xArtists. Utiliser les parcours hébergés des partenaires, vérifier les budgets réels avant engagement.

## Ordre de livraison

| P | Produit | Preuve obligatoire |
|---|---|---|
| P0 | Wallet et listing NFT MultiversX | Clic sans navigation, signature explicite, dépôt vérifié, annonce réelle et annulation récupérable (#645, #428). |
| P0 | Studio NFT : production à l'unité ou en série | Prix de service séparé des coûts de chaîne, droits sur l'œuvre, devis exact, reçu et livraison. Les tarifs dégressifs validés en principe restent à finaliser ; paiement par lot plutôt que micro-paiement carte par NFT. |
| P1 | Paiement de services (Stripe / PayBox candidats) | Activité acceptée, environnement test distinct, webhook signé, rapprochement idempotent, remboursement, TVA et frais ; pas d'activation implicite des packs NFT ou xOrus. |
| P1 | Onramp MoonPay | Vérification de l'éligibilité pays/actif, devis partenaire, destination EGLD liée au compte, confirmation de livraison. Solana est un rail séparé à qualifier ; ne pas passer une adresse SOL au rail EGLD. |
| P2 | Rémunération des artistes en fiat | Connect candidat sous réserve d'acceptation de l'activité ; KYB/KYC vendeur, litiges, chargebacks, commissions, fiscalité et pays. Aucun transit par un faux solde local. |
| P3 | Compte multidevise et carte | Contrat partenaire, entité réglementée, territoires autorisés, financement et retraits, limites, litiges, carte virtuelle d'abord. Finance Computer / Bridge / Gnosis Pay / autres à étudier, aucun choix contractualisé. |

## Contrat API existant

Le GET /v1/commercial/catalog expose un champ global_pay planning_only. Les cinq rails ont tous leurs capacités de checkout, transfert, solde conservé et émission de carte à false. Ce champ ne désactive ni n'autorise les fonctions wallet on-chain déjà soumises à leurs propres contrôles. Les devises sont des cibles produit, pas des devises certifiées par un prestataire. Pas de nouvelle route de paiement ni nouvelle base de données.

Les services existants (Stripe/PayBox/MoonPay, commercialRails, publicCommercialCatalog) restent les points de réutilisation. Les droits, les statuts de livraison et les reçus restent séparés des opérations financières. Ne pas dupliquer la logique des fournisseurs.

## Vérification réglementaire et opérationnelle

- Stripe restreint certaines activités liées aux NFT et crypto : https://stripe.com/legal/restricted-businesses. Faire qualifier explicitement les produits et la structure de marketplace avant ouverture, même si un compte Stripe existe.
- AMF : autorisation MiCA pour les services crypto relevant du règlement depuis la fin de la transition au 1er juillet 2026 en France : https://www.amf-france.org/fr/actualites-publications/dossiers-thematiques/mica. Analyse des obligations de paiement/monnaie électronique et des territoires avec conseil qualifié.
- Le sandbox Stripe Nelsonprods prévu dans le dépôt (docs/ops/STRIPE_BILLING_MULTIRAIL_SANDBOX_2026-11-10.md) n'est pas disponible dans la connexion inspectée le 27/11 ; seul le mode réel est visible. Aucun produit, prix, abonnement ou session créé. Obtenir l'accès test avant intégration.
- Critères go-live : preuve PSP réelle en test, webhooks bruts signés, binding compte/commande/devise/montant, idempotence, traitement des annulations/retours/chargebacks, tests CORS et mobile, observabilité sans secrets, contrôles d'éligibilité et tests de non-régression. Déploiement puis preuve publique séparés de la CI.

Références : #645, #428, #613, #465, docs/MOONPAY.md, docs/ops/STRIPE_BILLING_MULTIRAIL_SANDBOX_2026-11-10.md.
