# Neon Auth xArtists — recette sandbox, sans activation (10 novembre 2026)

**Périmètre : lecture seule du connecteur Neon pour `xartists-access-sandbox`, branche `sandbox`.** Ceci n'identifie pas la base réellement connectée au backend Render et ne certifie pas un compte utilisateur de production.

## Observations de configuration (10/11/2026)

| Contrôle | Observation sandbox | Effet sur GO production |
|---|---|---|
| Fournisseur Auth | Better Auth via Neon Auth | Intégration API de production et vérification des sessions non prouvées |
| Email + mot de passe | Activés ; inscriptions permises | Un environnement de test uniquement |
| Vérification email obligatoire à l'inscription | `false` | **NO-GO** pour l'authentification utilisateur réelle |
| Vérification email obligatoire à la connexion | `false` | **NO-GO** tant que comptes et emails non confirmés ne sont pas rejetés |
| `require_email_verification` | `false` | **NO-GO** pour l'accès à des abonnements |
| Origines de confiance explicites | Liste vide | À déterminer et tester pour le frontend public |
| Accès localhost | Autorisé | Revoir pour l'environnement public |
| OAuth Google | Fournisseur de type `shared` présent | Pas de connexion OAuth xArtists certifiée |
| Webhooks Neon Auth | Désactivés | Aucune synchronisation d'identité durable ou révocation prouvée |
| Tables `neon_auth.*` | Observées sur la branche sandbox | La présence des tables ne prouve pas la validation des sessions |
| Tables `public.paybox_orders`, `public.mint_jobs` | Observées sur sandbox | Ni ventes ni livraison vérifiées |

**Aucune configuration Neon Auth, aucun compte client et aucune base n'ont été modifiés durant ce contrôle.** Pas de secret, de DSN, de token OAuth, de données client ou de requête de connexion dans le présent document.

## Critères de sortie #465 — décision future séparée

- [ ] Confirmer que ce projet et cette branche sont le bon environnement de **test**, distinct de la production. Inventorier la cible de production et la liaison effective Render↔DB sans révéler de secrets.
- [ ] Approuver le fournisseur d'identité, ses coûts, ses origines autorisées et les obligations RGPD/consentement.
- [ ] En sandbox séparée, **après autorisation opérateur**, rendre l'email vérifié obligatoire pour sessions et droits d'abonnement, vérifier absence de bypass par email non vérifié, reset, récupération ou OAuth.
- [ ] Définir les trusted origins (Pages/Render et éventuel domaine vérifié), CORS/CSRF, cookies sécurisés et challenge d'association de wallet SIWX à usage unique, domaine/chainId/nonce/expiry.
- [ ] Vérifier sessions côté backend, verrouillage anti-takeover, logout, rotation, suppression/export, anti-abus et quotas. Aucun statut `verified` fourni par le navigateur ne suffit.
- [ ] Valider le ledger d'abonnement récurrent fiat par webhook PSP signé, idempotence multi-workers, annulation/refund, expiration et droits révoqués. Jamais de NFT/mint par ce rail.
- [ ] Produire un dossier de test avec environnement précis, SHA de build, incidents et reviewer indépendant avant autorisation séparée.

La PR [#479](https://github.com/Neltud/xArtists/pull/479) renforce uniquement la **projection pure** d'accès par dates. Elle ne branche pas Neon Auth au backend, ne vérifie pas de webhook et ne crée pas d'abonnement.

Références : issue [#465](https://github.com/Neltud/xArtists/issues/465), [launch gates](../security/launch-gates.md), [préparation commerciale](COMMERCIAL_LAUNCH_PREP_2026-11-10.md) (document proposé dans une PR distincte, #478). Tous les rails financiers demeurent **NO-GO**.
