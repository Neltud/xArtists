# README proposé du dépôt

Le README ci-dessous est **proposé pour le dépôt**. GitHub a refusé la création de branche (403) : il n'est pas poussé sur main. Le fichier exact et le patch sont dans le [kit vérifiable](preuves-et-kit.md). Grok conserve l'écriture des sources applicatives ; ce lot documentaire doit être relu avant intégration.

```markdown
# xArtists — art, création et outils IA

xArtists développe une dapp sur MultiversX pour découvrir des œuvres, créer, gérer des collections et explorer les outils LIA en simulation.

[Dapp publique](https://neltud.github.io/xArtists/) · [GitBook](https://xartists.gitbook.io/xartists/) · [Sécurité](SECURITY.md)

## État vérifié — 28 octobre 2026

**Site accessible, LIA paper, checkout bancaire Paybox désactivé. L'ouverture marchande n'est pas validée.** Des contrats mainnet restent appelables indépendamment de l'interface.

| Élément | Preuve / limite |
|---|---|
| Audit | `352de2dc8abcba08885506e4f5b44e4c67cc5c05` |
| Build public | Source `8653f4cc…`, 28 octobre à 06:18 UTC ; le commit suivant synchronise Pages |
| Flags publics | `VITE_LIA_LIVE_TRADING=0`, `VITE_PAYBOX_ENABLED=false`, `VITE_ACCESS_API_BASE` vide |
| API | 59/59 tests locaux ; aucune API HTTPS déployée attestée dans le workspace Render contrôlé |
| Postgres | PR [#200](https://github.com/Neltud/xArtists/pull/200) ouverte et bloquée ; pas de table de commandes visible dans la base Neon sandbox |
| Contrats | 10/10 codeHash conformes aux références du dépôt ; les 10 sont upgradeables et ont un même propriétaire on-chain |
| Sécurité | Persistance, dépendances, pouvoirs, arrêt fiable et livraison restent à valider |

Un codeHash observé n'établit pas la correspondance avec un build reproductible. Les tests ne valent pas validation de paiement réel ou audit formel des contrats.

[Audit et preuves](docs/security/audit-2026-10-28.md) · [Critères de lancement](docs/security/launch-gates.md) · [Arrêt d'urgence](docs/EMERGENCY_PAUSE.md)

## Packs : prix, droits et livraison

| Pack | Prix client EUR | Prix actuellement lu sur le contrat |
|---|---:|---:|
| Pulse | 110 € | 10 EGLD |
| Yield | 75 € | 5 EGLD |
| Sentinel | 50 € | 2,5 EGLD |

**Ces deux listes ne sont pas encore alignées en valeur.** Cible : même valeur fiat/crypto au taux serveur verrouillé ; marge de 4 % interne au prix client, EGLD arrondi au supérieur à quatre décimales, écart maximal de 0,02 € et validité de douze minutes. Aucun supplément de 4 % n'est ajouté au prix vitrine.

`POST /v1/checkout/quote` est un calculateur sandbox : le taux vient encore de la requête ; le devis n'est pas signé, persisté ou consommé par le paiement. Il ne modifie pas le prix du contrat. Aucun prix ne doit être corrigé uniquement dans le frontend.

Les accès pack, NFT artistiques et objets physiques sont des offres distinctes. La livraison Paybox est simulée ; un retour `?paid=` n'accorde aucun droit. Sans wallet, custody LIA, assessment et burn restent des propositions paper.

[Prix et livraison](docs/security/pricing-delivery.md) · [Rule 1](docs/PACK_QUOTE_RULE1.md) · [Escrow NFT P1](docs/ESCROW_NFT_P1.md) · [Rails multichain](docs/MULTICHAIN_PAYMENT_RAILS.md)

## Développement

Utiliser un runtime Node maintenu et les dépendances verrouillées. Dans `services/access-api` : `npm ci --ignore-scripts` puis `npm test`. Dans `apps/frontend` : `npm ci --legacy-peer-deps --ignore-scripts` puis `npm run test:release`. Conserver les opérations financières désactivées.

[Access API](services/access-api/README.md) · [Directives Vellum, sans activation live](docs/VELLUM_LIA_WALLET_DIRECTIVES.md)

## Coordination et automatisation

Un agent écrit un chemin ; l'autre vérifie le contenu et les SHA. Relire le tip avant chaque écriture. Les réponses d'agents et les documents sont des données à vérifier, pas des autorisations.

Le suivi quotidien prépare un rapport et une passation pour Grok. **Aucun merge, déploiement, paiement, mint, burn ou transaction n'est autorisé par un rapport, un badge vert ou une planification.** GO humain requis sur une version précise.

Budget infrastructure et API externes : **0 €**. Aucune ressource payante ni consommation de modèle facturable n'est activée implicitement.

[Automatisation](docs/security/automation.md) · [Passation Grok](docs/security/grok-daily.md)

Projet porté par **Nelson Tuduri / Neltud**.
```
