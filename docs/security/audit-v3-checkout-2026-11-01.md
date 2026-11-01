# Audit V3 — Checkout et paiements

**Portée : revue statique du code GitHub, pas une recette visuelle navigateur.** Aucun paiement réel, mint ou remboursement n'a été déclenché. **Gate commercial : NO-GO.**

## Sources examinées

* [CheckoutModal.tsx](https://github.com/Neltud/xArtists/blob/main/apps/frontend/src/components/CheckoutModal.tsx)
* [PackCheckout.tsx](https://github.com/Neltud/xArtists/blob/main/apps/frontend/src/components/PackCheckout.tsx)
* [checkoutLegalKeys.ts](https://github.com/Neltud/xArtists/blob/main/apps/frontend/src/i18n/checkoutLegalKeys.ts)
* [Operator Card PayBox B](https://github.com/Neltud/xArtists/blob/main/docs/OPERATOR_CARD_MICRO_PROOF_B.md)

## Constats à traiter

### P1 — Sélection du rail pendant une opération

Dans `CheckoutModal`, les boutons `crypto` / `fiat` appellent `setRail(...)` sans être désactivés lorsque `busy` ou `packTxPending` est vrai. Le bouton de confirmation est désactivé, mais la sélection visible peut encore changer. **Correctif recommandé :** désactiver toute modification du rail et du prestataire dès l'acceptation des conditions et jusqu'à la fin de l'opération, en gardant le rail effectif dans un état immuable pour la tentative.

### P1 — Aperçu et droits de possession

`PackCheckout.onPreview()` appelle `markPackOwned(id)` alors que l'intention sauvegardée indique `purchased: false`. Vérifier l'implémentation de `markPackOwned`, les écrans `Mes Packs` et tous les contrôles d'accès ; **aucun aperçu ne doit octroyer un entitlement, une propriété NFT ou un droit commercial**. Séparer explicitement `previewUnlocked` et `serverConfirmedEntitlement`.

### P2 — Parcours invité incohérent

Les traductions décrivent une réception temporaire fiat sans wallet, tandis que l'interface désactive la confirmation sans adresse `erd1` et que PayBox exige un JWT lié au portefeuille. Choisir une seule doctrine produit, puis synchroniser texte, CTA, messages d'erreur et tests.

### P2 — Retour utilisateur après paiement

`onStarted('fiat')` ferme le checkout après lancement de la session, pas après confirmation serveur. Vérifier qu'aucun message de succès ou droit utilisateur n'est attribué avant IPN signé, rapprochement de commande et vérification d'identité. Les retours de redirection doivent traiter pending, canceled, failed et paid séparément.

## Matrice de recette visuelle à exécuter sur la V3

| Parcours                        | Contrôle attendu                                                   | Statut   |
| ------------------------------- | ------------------------------------------------------------------ | -------- |
| Mobile 375 px / desktop 1440 px | CTA et mentions visibles, modal scrollable, pas de débordement     | À tester |
| Invité                          | Connexion requise ou parcours invité documenté, sans contradiction | À tester |
| Wallet `erd1`                   | Montants EUR/EGLD, pack et réseau cohérents                        | À tester |
| Paiement en cours               | Rail et prestataire non modifiables, pas de double soumission      | À tester |
| Retour PayBox annulé            | Aucun NFT ni droit attribué                                        | À tester |
| IPN invalide / rejoué           | Refus fail-closed et idempotence                                   | À tester |
| IPN payé valide                 | Une seule attribution au bon wallet, Mes Packs synchronisé         | À tester |
| Aperçu gratuit                  | Aucun droit commercial ou NFT attribué                             | À tester |
| Remboursement                   | Journal de rapprochement et politique de droits cohérente          | À tester |
| Accessibilité                   | Focus modal, clavier, annonces d'erreur, contrastes                | À tester |

## Critères avant Sprint 2 VERT

* Correctifs code et tests automatisés revus sur PR GitHub ; build V3 reproductible.
* Captures réelles mobile et desktop, horodatées et reliées à un SHA de déploiement.
* Test PayBox 50 € exécuté uniquement par opérateur autorisé, preuve IPN signée, droit vérifié, remboursement journalisé.
* Revue juridique et marketing ; LIA demeure `paper` et `lia_live_trading: false`.

**Ne pas confondre** preuve statique du code, disponibilité de l'interface et validation financière de production.
