# xOrus — seules les sources gratuites avec droits compatibles

**13 novembre 2026 · registre public en lecture seule /v1/xorus/free-sources.** Objectif : faire payer **les analyses originales xArtists**, jamais un feed brut. « Gratuit à consulter » n'implique PAS « autorisé pour analyser commercialement ».

## Sources officielles gratuites retenues, dans leur périmètre

| Source | Statut du périmètre | Documentation des droits | Distinction importante |
|---|---|---|---|
| Eurostat — seules les statistiques **produites par Eurostat/UE** | Réutilisation commerciale gratuite avec attribution de la source et éventuelles modifications | https://ec.europa.eu/eurostat/help/copyright-notice | Exclure les contenus tiers, copublications et restrictions spécifiques ; dataset DOI/id et citation exacts obligatoires |
| The Metropolitan Museum — œuvres **Open Access/CC0** | Exploitation commerciale gratuite des œuvres Open Access | https://www.metmuseum.org/fr/policies/terms-and-conditions | Un objet non CC0, protégé, de droits photo tiers ou de publicité ne devient pas commercial libre |
| Smithsonian — éléments marqués **CC0** uniquement | Usage commercial gratuit, sans permission du Smithsonian | https://www.si.edu/openaccess/faq | Vérifier statut CC0 *par item*, droit de la personnalité, marques et tiers ; une œuvre non CC0 ne passe pas |

Les sources **BCE** et **Banque mondiale** restent candidats à documenter : chaque dataset et ses exceptions doivent être vérifiés avant autorisation. **MultiversX on-chain** reste une piste prioritaire pour les faits natifs ; le fait qu'une blockchain soit publique ne prouve pas les droits de réutilisation commerciale des enrichissements d'un indexeur/API. Ne pas utiliser plusieurs endpoints du même indexeur comme preuves indépendantes.

**Exclus** du mode commercial gratuit : Binance Spot/Vision, CoinGecko Demo/keyless, Artprice, OpenSea et réseaux sociaux non certifiés. CoinGecko indique explicitement que le **plan Demo** ne comprend pas de droits commerciaux (https://support.coingecko.com/articles/1043089972-what-are-the-differences-between-commercial-and-custom-licenses). Ne pas substituer une licence payante dans le registre gratuit.

## Contrôle technique

- `services/access-api/src/xorusFreeSourcePolicy.mjs` conserve trois identifiants et références de droits explicites, plus une denylist. Aucun token ni secret ; aucune donnée extérieure demandée par l'endpoint.
- `crosscheckOpenSourceCandidates` fonctionne **hors réseau** sur observations préparées ; rejette avant recoupement les données de droits inconnus, tardives, non finies, de schéma inconnu, avec attributs de licence non conformes.
- Les miroirs d'une même **origine réelle** ne comptent qu'une fois. Deux origines différentes doivent observer la **même métrique et la même unité**, avec dispersion au plus 2 % (seuil de précontrôle, pas qualité financière garantie).
- La sortie ne révèle que métrique, unité, origine-count et `corroboration_candidate`; **pas de valeurs brutes**. Même après recoupement technique, `independently_verified_signals=0`, `commercial_enabled=false`, `trade_authorized=false`, `executable=false`, `ABSTAIN`. Il faut une **preuve cryptographique d'acquisition indépendamment signée**, une source d'origine vraiment distincte, un contrat de droits par donnée/usage et une recette E2E avant d'émettre un signal commercial.
- Le registre est **informatif**, et `data_feed.COMMERCIAL_SOURCE_POLICY` reste **tout désactivé**. La sortie publique ne confère aucun droit de livraison premium ni de publication.
- Le trader « autonome » reste moteur de scénarios et d'ordres virtuels déterministes. Pour un vrai trade, il faudrait un service distinct, compte autorisé, consigne signée explicite, plafond de perte, kill-switch, droits fournisseur, et revue de conformité ; cette PR ne le construit ni ne l'active.

## Produit cible

Les flux gratuits peuvent servir à nos interprétations (statistiques macro UE, art CC0, activité on-chain auditable), sous attribution et limites. Mais **la compatibilité juridique** ne garantit ni la précision, ni l'indépendance d'une observation de marché, ni la fraîcheur, ni une décision d'investissement. L'objectif commercial est un rapport xArtists transparent, explicable et limité aux faits suffisamment prouvés. Les sources brutes restent privées.
