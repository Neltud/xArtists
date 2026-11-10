# xArtists — Artprice by Artmarket.com : accès officiel et licence de données

**Décision du 10 novembre 2026 — PREP uniquement.** xArtists retire les parcours marchands Shopify/Etsy, conserve ses modules artistiques et propose un **point d'accès aux publications officielles Artprice**, sans revendiquer de partenariat, d'expertise, de flux de prix licencié ni de recommandation d'achat.

## Sources vérifiables

- [Artprice officiel](https://fr.artprice.com/) — société éditrice **Artmarket.com**.
- [Rapport 2026 du marché de l'art contemporain publié par Artprice](https://fr.artprice.com/artprice-reports/le-marche-de-lart-contemporain-2026) : analyse publique de la période juillet 2025–juin 2026, sans copie de la base détaillée.
- [Rapport mondial du marché de l'art 2025 publié par Artprice](https://fr.artprice.com/artprice-news/13751/le-rapport-mondial-du-marche-de-l-art-2025-par-artprice-la-reprise-tant-attendue-semble-avoir-commence) : lien externe, pas de reproduction du contenu.
- [CGV/conditions d'utilisation Artprice](https://fr.artprice.com/block/cgv?modal=true) : limitations de requêtes automatisées, fouille de données, algorithmes, IA et réutilisation.
- [Communiqué de licence B2B de 2023 sur Euronext](https://live.euronext.com/sites/default/files/company_press_releases/attachments/2023/09/19/cpr05_actus_81806_FR0000074783.pdf) : Artprice évoque une **API B2B pour l'index des artistes** et un contrat séparé de renvoi/affiliation vers les bases de données payantes. **Le montant indicatif publié en 2023 n'est pas un devis actuel.**
- [Rapport financier / communiqué officiel 2026](https://live.euronext.com/fr/products/equities/company-news/2026-04-28-artmarket-artprice-resultats-lactivite-2025-et-mise) : stratégie Artprice de **Data Licensing B2B**.

**Attention : `artmarketapi.com` n'est pas identifié comme étant Artprice by Artmarket.com.** Ne pas réutiliser ses API ni appeler un endpoint tiers en le présentant comme « API officielle Artprice ». N'inventer aucun endpoint, contrat, clé, licence ni volume de cotations.

## Périmètre disponible maintenant

1. **Site public** : la Marketplace expose des liens directs vers le rapport officiel 2025 et le site Artprice, clairement étiquetés comme ressources **tierces et externes**. Aucun prix, indice, image, classement ou comparable Artprice payant n'est copié dans xArtists.
2. **Backend** : `GET /v1/artprice/status` renvoie seulement le contrat public de provenance et `licensed=false`, `records_available=false`, `data=[]`. `/v1/artprice/records` répond **403** `artprice_written_license_required`, pour toutes les méthodes. Un ancien secret ou `ARTPRICE_LICENSE_APPROVED=1` ne change pas ce statut.
3. **Préparation technique** : `validatePotentialArtpriceRecord` vérifie un futur format d'export en interne (identifiant source, artiste, date, monnaie, prix marteau hors frais), mais **n'accepte aucune donnée en production et n'affirme aucune authenticité**. Les tests de shape emploient des valeurs fictives locales exclusivement.
4. **Données de la dApp / Render** : ne pas changer PostgreSQL, l'identité, le ledger des abonnements ni le workflow LIA ; aucune analyse d'IA n'est entraînée ou enrichie avec le contenu du fournisseur.

## Prérequis contractuels avant première donnée

- Obtenir de **Artmarket.com / Artprice** un contrat signé détaillant le **périmètre des produits** (index artistes, résultats d'enchères, images, tendances, historiques), les **finalités** (consultation, redistribution web, cache interne, agrégats, agents IA, entraînement interdit/autorisations spécifiques), les territoires, l'attribution, la durée, les plafonds de requêtes, les audits, la suppression et les coûts.
- Vérifier que la licence autorise explicitement **l'affichage aux utilisateurs finaux de xArtists** ; un simple abonnement Artprice individuel ne constitue pas une licence de redistribution ou une autorisation de scraping. Une autorisation d'interrogation de l'index des artistes ne couvre pas nécessairement les prix de vente.
- Faire fournir par Artprice l'**endpoint/format d'export exact**, l'authentification requise, les clés serveur, les périodes de fraîcheur, la documentation et les environnements de test. Ne pas inventer l'URL d'API.
- Mettre en place **côté serveur uniquement** : allowlist fournisseur, secrets dans Render (pas en `VITE_`, GitHub, navigateur, IPFS ou logs), quotas, retries bornés, validation des champs, CIDs ou identifiants si applicable, timestamps et provenance, stockage minimum avec TTL conforme au contrat, vérification de révocation, suivi d'accès/erreurs.
- **Séparer** résultats passés en vente et prix marteau **hors frais** des estimations, prix demandés, prix avec frais, cours de devises, cotations indicatives ou évaluations humaines. Ne publier ni prix ni graphique sans périmètre de licence et origine certifiés.
- Revue juridique et recettes d'intégrité sur les réponses véritables autorisées, y compris disponibilité du fournisseur, absence de données, erreurs d'authentification, quotas, expirations et suppression. **Fail closed** pour toute source indisponible ou hors périmètre.
- Exiger une PR de déverrouillage distincte avec preuves contractuelles **non publiques** et suite de tests, puis décision GO explicite. Aucun achat, paiement, transfert, mint ou conseil financier automatique.

## Retrait des anciennes places de vente

- Les références marchandes tierces ont été supprimées des pages publiques et de la présentation courante. `/v1/physical/config` renvoie `vendor_retired`, `enabled=false`, `commerce_provider=none`.
- L'ancien `/v1/webhooks/shopify/physical` répond **410 Gone** sans lire le corps ni modifier PostgreSQL ; l'importeur physique historique est désactivé en dur et n'est plus relié au serveur.
- **Risque opérationnel :** après déploiement, retirer les anciens webhooks au tableau de bord marchand et révoquer/supprimer leurs clés et secrets côté fournisseur et Render. Ne jamais afficher ces secrets ici ; désinstaller les connecteurs marchands non utilisés dans le compte concerné. La suppression d'une boutique, d'un abonnement ou d'un compte tiers ne résulte pas automatiquement d'une PR GitHub.
- La conservation des anciennes données d'œuvres doit suivre la politique de conservation et les droits d'accès applicables. Ne pas effacer des commandes ou dossiers historiques sans audit.

**Statut réel :** l'accès libre aux publications officielles est préparé ; **l'intégration aux bases détaillées Artprice reste en attente d'un contrat**, pas de fournisseur artificiel ou de scraping.
