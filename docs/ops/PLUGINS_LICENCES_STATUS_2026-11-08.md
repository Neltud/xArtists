# Plugins / licences — état (2026-11-08)

## Faits

| Élément | État |
|---------|------|
| PR #421 entitlements PAPER | Fusionnée ; gate **OFF** par défaut |
| `checkPluginEntitlement` | Bibliothèque pure ; pas de paiement live |
| Migration SQL candidate | Non appliquée en prod |
| Exception owner gratuite | **Refusée** (pas de bypass adresse) |
| XA World Rights (#415) | ZIP **MIT** — ne peut pas être vendu comme plugin propriétaire exclusif sans revue licence (#416) |
| Issue #375 registry signé | Ouverte : signature, scopes, révocation |
| PayBox → entitlement NFT | Micro-preuve B non journalisée |

## Blocages avant commercialisation plugin

1. Revue d'auteur / licence (#416) et modèle de distribution choisi.
2. Session serveur authentifiée (challenge wallet), **pas** adresse collée.
3. Grant HMAC serveur + ligne DB durable + webhook provider vérifié.
4. Endpoint `/plugins/me` authentifié ; artefacts hors route statique publique.
5. Registry signé (#375) avec révocation.

## NO-GO

Aucun téléchargement payant, aucun mint sur paiement plugin, aucun revenu router live dans ce sprint.

Réf. : `docs/security/PLUGIN_ENTITLEMENTS_PAPER_V1.md`, issues #416 #375 #281.
