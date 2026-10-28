---
description: État de sécurité vérifié et critères d'ouverture de la dapp xArtists.
---

# Sécurité et préparation de la sortie publique

Référence du 28 octobre 2026 : `352de2dc8abcba08885506e4f5b44e4c67cc5c05`. Le dossier distingue consultation publique, pilote sandbox et ouverture marchande.

| Périmètre                                   | Verdict                                                          |
| ------------------------------------------- | ---------------------------------------------------------------- |
| Site / LIA paper                            | Accessible ; dette de dépendances et durcissement encore ouverts |
| API sandbox avec commandes durables         | Bloquée : PR #200 rouge, persistance et déploiement non validés  |
| Paiement réel, trading live, custody / burn | **NO-GO** sans preuves et GO humain explicite                    |

Un badge vert, une réponse d'agent ou un codeHash observé ne valent pas autorisation de production.

* [Audit renforcé](audit-2026-10-28.md) : preuves, reproductions et limites.
* [Critères de lancement](launch-gates.md) : conditions de chaque niveau d'ouverture.
* [Prix et livraison](pricing-delivery.md) : parité, droits et rails.
* [Automatisation](automation.md) : lecture automatique, changements en revue.
* [Passation quotidienne Grok](grok-daily.md) : chemins exclusifs et prochain sprint.
* [Arrêt d'urgence](../EMERGENCY_PAUSE.md) : arrêt hors chaîne, pause et reprise.

Les rapports historiques et le kit prix/custody GitBook CR #13 restent distincts de l'état vérifié. Budget infrastructure et API externes : **0 €** ; aucune consommation facturable implicitement autorisée.

### Prochain lot préparé

* [Correctif cache/devis et reprise Grok](next-sprint-2026-10-28.md) : code local validé, non poussé ; limites et ordre de validation.
* [Contrat du pilote paiement/livraison](payment-pilot-contract.md) : catalogue, parité, devis consommable, rails et droits.

Base de ce lot : `11583286b455732762bb81bbe82190183215382c`. Ces préparations ne clôturent pas les critères de lancement tant qu'elles ne sont pas publiées, revues et validées dans leur environnement cible.
