---
description: >-
  Connexions constatées, rôle du copilote LIA et préparation de TCA Academy sans
  activation financière.
---

# Connexions — LIA, Grok, MoonPay et TCA Academy

État préparé le 28 octobre 2026, sur `main` `11583286b455732762bb81bbe82190183215382c`. Ce document est une préparation en revue, pas une configuration de service déployée. Les connexions de cette conversation ne deviennent pas automatiquement des connexions de la dapp ou de Vellum.

**Ce qui est vérifié**

| Intégration                 | Constat                                                                                               | Usage immédiat et limite                                                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub                      | Identité connectée reconnue et dépôt `Neltud/xArtists` lisible ; compte propriétaire avec droits repo | Lecture des sources et CI. Les droits du compte ne prouvent pas ceux du connecteur : ses dernières écritures ont été refusées par 403                    |
| Grok Bot Control            | Skill et protocole disponibles ; aucun outil Grok natif ou fil courant identifié                      | Préparer une passation vérifiable. Aucune conversation n'a été lue ou message envoyé                                                                     |
| LLM & Agent Builder Copilot | Skill de conception et revue disponible dans cette conversation                                       | Cadrer le relais LIA, produire des propositions et critères de validation. Aucun nouveau modèle hébergé ou daemon installé                               |
| MoonPay                     | Outils disponibles pour un lien d'achat crypto et lecture d'un wallet nommé explicitement             | Aucun compte partenaire, statut KYB, clé test/live ou capacité d'encaissement marchand attesté                                                           |
| vidIQ                       | Autorisation réussie ; une chaîne renvoyée ; 150 crédits renouvelables, aucun crédit additionnel      | Diagnostic de connexion effectué par deux appels à coût nul ; 0 crédit consommé pour chacun. Pas de recherche à crédits, génération média ou publication |

Les adresses de compte privées, emails d'authentification et identifiants de session ne font pas partie du kit public. Le détail du compte reste dans la conversation de son titulaire.

**Suppléance LIA**

Le contrat de relais retient un workflow explicite : lire une source épinglée, contrôler les preuves, rédiger une proposition, demander une revue, préparer la passation. Il complète le travail produit/ops de LIA quand Vellum est indisponible. Il n'installe pas un deuxième exécuteur et n'établit pas de bascule automatique.

Les propositions de correctif, rapports d'incident et contenus pédagogiques peuvent être préparés dans ChatGPT. L'exécution financière et les changements de production restent dans le chemin autorisé avec GO humain ; aucun wallet ou secret n'est transféré au copilote.

**MoonPay : cadrage du pilote**

La documentation officielle distingue le widget d'achat crypto en sandbox et en production. Le produit on-ramp achète de la crypto pour son destinataire ; ce résultat n'est pas une preuve d'achat d'un pack xArtists. Les droits exigent toujours la chaîne de preuves propre à la commande.

Avant un pilote intégré : confirmer le produit partenaire retenu, utiliser une configuration de test séparée, choisir une seule combinaison actif/chaîne réellement disponible et vérifier les paramètres signés. Les nouvelles intégrations on-ramp doivent notamment respecter les exigences actuelles de signature d'URL et d'IP matching indiquées par MoonPay. Ces contraintes n'ont pas été revalidées sur le code existant dans ce lot.

Les clés live dépendent de l'approbation du produit partenaire. Le plugin ChatGPT ne remplace ni cette approbation, ni le backend de signature, ni les contrôles de livraison. Ne pas faire passer les clés live dans Vite, un prompt, GitBook ou un journal.

Sources officielles consultées le 28 octobre :

* [Intégration URL du widget](https://dev.moonpay.com/widget/on-ramp/integration-methods/url).
* [Passage partenaire en production](https://support.moonpay.com/en/articles/388689-how-to-go-live-with-moonpay-as-a-partner).

Aucun achat, wallet interrogé, ouverture de compte, clé récupérée, service facturable ou changement de production n'a été effectué. Budget additionnel autorisé : 0 EUR.

**TCA Academy**

Le pilote pédagogique propose quatre masterclasses : sfumato, paysage à l'encre, géométrie et relief. Le déroulé du premier cours est prêt à relire et filmer. Les textes et exercices sont originaux ; les sources de musée servent au contexte et ne constituent pas une licence de réutilisation de leurs images ou vidéos.

vidIQ servira à tester les sujets, titres et performances lorsqu'un budget de crédits et un objectif précis seront fixés. Les appels de recherche consultés coûtent 5 crédits chacun ; ce lot conserve les 150 crédits. Aucun score SEO, volume de recherche ou résultat de performance n'est inventé.

**Kit de reprise**

[Sources, patchs, conducteur du cours, contrats JSON et preuves](../.gitbook/assets/xartists-lia-tca-connections-2026-10-28.zip)

Archive : 71000 octets, 27 entrées ; SHA-256 `61aef12505c6f0c5da09f5ae67e44db33d493deaac1ad0ac0fe4f924d6020698`. Code local `7bc22143c480e26ac4419e3ee9c64196045e2112` ; documentation `d79f36030c42a11aaf6059dca13abf62f9d9742b`. Non poussés : le connecteur GitHub a encore refusé l'écriture (403). Le montage frontend avec le lot cache/devis passe **56/56** localement, sans merge ni déploiement.

#### Documents de ce lot

* [Contrat de relais LIA](copilote-relais-lia.md).
* [Programme TCA Academy](../tca-academy-pilote-2026-10-28/).

### Prompt de reprise Grok

[Ouvrir le prompt complet à copier](prompt-grok-reprise-2026-10-28.md).

Instantané vérifié : #200 à `fdc406ff27ab940b8c3cf475c26ec581d12a4cf6`, CI Paybox 59 réussites et 2 échecs sur 61. Relire son tip avant action. Les kits sont à comparer aux fichiers récents, pas à appliquer à l'aveugle.
