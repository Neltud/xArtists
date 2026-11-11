# xOrus Data Broker — architecture et déploiement

**PREP : aucun flux xOrus ou revendeur activé.** Les 120 IDs sont des signaux définis, non 120 signaux temps réel.

## Contrat d’agent ChatGPT
- Objectif : données de provenance vérifiée, horodatage, réseau et droits de redistribution pour des packs NFT ou abonnements.
- Workflow borné : 4 lecteurs maximum, 10 s par appel, pas de boucle autonome, aucune mutation ni signature.
- Sources : adaptateurs MultiversX, Polygon, Solana envisagés, à développer et tester ; Artprice et réseaux sociaux requièrent des licences écrites séparées.
- Code : lia.xorus.data_feed.build_data_pack produit no_input si absence de source fiable, de preuve, de fraîcheur ou de licence. Le registre trusted_providers est serveur uniquement, jamais issu du navigateur ni d’un prompt.
- Contrats outils futurs : xorus_get_signals (lecture, IDs + réseau + provenance), xorus_check_access (entitlement validé côté serveur ; deny par défaut), xorus_explain_snapshot (rapport pédagogique, sans conseil de transaction).
- Erreurs : abstention si API 401/403/429, horodatage futur/périmé, NaN, licence expirée, attestation absente, timeout. Pas de fallback de données simulées présentées comme live.

## Monétisation — non activée
| Produit | Condition |
| --- | --- |
| Découverte | Accès à l’inventaire des signaux sans wallet |
| Pack NFT xOrus | NFT possédé sur la bonne chaîne + droits contractuels vérifiés côté serveur |
| Abonnement xOrus Data | Identité, PSP confirmé, quota, expiration et révocation côté serveur |

L’authentification et la propriété d’un NFT ne suffisent pas à garantir les droits de revente des données. Le système doit enregistrer la licence fournisseur, l’empreinte du snapshot, sa durée de conservation et la politique de redistribution. Aucune donnée Artprice payante sans contrat écrit.

## Récompense artiste — 1 TRO par NFT physique créé
L’ancienne règle first_sale du code legacy reste **à migrer/désactiver avant distribution**. Le déclencheur demandé est le mint d’un véritable NFT physique xArtists, avec reçu MultiversX finalisé, droits artiste, identifiant physique, minter autorisé, anti-doublon, cap et réserve contrôlée. lia.xorus.physical_rewards.evaluate_physical_mint émet seulement un **candidat d’une unité TRO** ; payout_status=not_paid et transfer_authorized=false. Le ledger transactionnel et le transfert exigent une implémentation distincte, une revue et une signature humaine.

## Labo et parcours utilisateur
Studio → /lab?view=3d (4–36 photos ou MP4, aperçu local) → /digital-twin (échelle et photogrammétrie COLMAP) → GLB UV vérifié par hash → IPFS redondant → mint signé humain → reçu → éligibilité TRO. Une animation photo n’est pas un mesh métrique.

## Critères GO
Tests offline et CI, provenance et licence, intégration du vérificateur signé, stockage durable idempotent, facturation/entitlements, pilotes testnet puis mainnet sous contrôle humain. LIA et Vellum restent des chemins internes legacy jusqu’à la migration de leurs consommateurs ; pas de suppression aveugle.
