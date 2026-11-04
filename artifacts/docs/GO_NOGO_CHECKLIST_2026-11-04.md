# Checklist GO / NO-GO — revue du 4 novembre 2026

## Provenance et portée

Cette version est une nouvelle rédaction vérifiable, reconstituée à partir du résumé fourni par Nelson et de lectures effectives du dépôt et des API publiques. Elle ne certifie pas le contenu des deux fichiers précédemment annoncés sous artifacts/docs/, introuvables dans main et dans cet espace de travail lors de la première lecture.

Pendant la revue, le commit [3196e758](https://github.com/Neltud/xArtists/commit/3196e7586466cda715a532d33bb9c3c7a66ce1fb) de la branche de capacité a publié une spécification sous [docs/PROMPT_LLM_ADVISOR_SHADOW_PAPER.md](https://github.com/Neltud/xArtists/blob/3196e7586466cda715a532d33bb9c3c7a66ce1fb/docs/PROMPT_LLM_ADVISOR_SHADOW_PAPER.md), mais la checklist et les tests y étaient encore des placeholders. La présente révision est isolée pour ne pas écraser ces écritures concurrentes. Le prompt de revue joint reste une proposition distincte, sans implémentation.

Référence du dépôt relue : [main de0ec71559a6bdea86bb09771b61c89060d1fdad](https://github.com/Neltud/xArtists/commit/de0ec71559a6bdea86bb09771b61c89060d1fdad), qui inclut [PR #378](https://github.com/Neltud/xArtists/pull/378). Correctif capacité initial : [adbaa67663a852ae49e66f71e45ae05666eecd53](https://github.com/Neltud/xArtists/commit/adbaa67663a852ae49e66f71e45ae05666eecd53). Le statut de fusion/déploiement de cette nouvelle revue doit être vérifié séparément.

Les valeurs inconnues restent **NON VÉRIFIÉES**. Une case cochée décrit une preuve précisément délimitée ; elle n'active rien.

## Principes

- [x] Le chemin LIA Simple relu conserve PAPER, paiement/livraison/NFT/accès faux, txHash null et débit nul.
- [ ] Toute ouverture commerciale exige une décision distincte, des preuves PSP/chaîne et des contrôles de remboursement.
- [ ] Les clés privées/PEM restent dans le dispositif de signature opérateur, hors Git, prompts, logs et dépendances LLM.
- [ ] Une preuve de connexion SIWX n'est jamais une permission de dépense.
- [ ] Un codeHash non nul n'est ni une preuve de correspondance au source, ni un audit, ni une preuve de livraison.
- [ ] Une CI verte n'est ni une publication ni un changement des flags runtime.

## Contrats — observations publiques en lecture seule

Source des adresses/hashes attendus : [data/contracts.json au SHA relu](https://github.com/Neltud/xArtists/blob/de0ec71559a6bdea86bb09771b61c89060d1fdad/data/contracts.json).
Détails machine : [CONTRACT_SNAPSHOT_2026-11-04.json](CONTRACT_SNAPSHOT_2026-11-04.json).
GET comptes demandés entre **16:44:55 et 16:45:03 UTC**. Le gateway /network/config a répondu chainId **1**. Ce n'est pas une lecture atomique de tous les comptes au même bloc.

Le registre référence **neuf** contrats courants, plus un staking legacy exclu de cette revue. getAllScSnapshots() en énumère huit et omet agent_stake_escrow, alors que UNLOCK_JOBS en contient neuf. Un nombre annoncé de « huit contrats » ne définit donc pas le périmètre complet.

| Contrat | Adresse mainnet lue | codeHash non nul / conforme au registre | Payable compte | Source/WASM | Scénario exécuté | Audit indépendant | Micro-proof utilisateur |
| --- | --- | --- | --- | --- | --- | --- | --- |
| venue_split | `erd1qqqqqqqqqqqqqpgqvy4qejg6lds00hy829nwmyxktrdqsuq3vhxq2vje2y` | Oui / oui | false | Non vérifié | Non vérifié | Non vérifié | Non vérifié |
| nft_marketplace | `erd1qqqqqqqqqqqqqpgqx0araa285cdepdsfe8s23mer30r3dh9lvhxqq8txmm` | Oui / oui | true | Non vérifié | Non vérifié | Non vérifié | Non vérifié |
| agents_marketplace | `erd1qqqqqqqqqqqqqpgqgawa0p5y09f0e68pwaa50zm47jl9jxcwvhxqgdqwsg` | Oui / oui | false | Non vérifié | Non vérifié | Non vérifié | Non vérifié |
| nft_staking | `erd1qqqqqqqqqqqqqpgq9ensu3f3p9yx4a583swu0raq8zzeve7tvhxq4fgtgu` | Oui / oui | false | Non vérifié | Non vérifié | Non vérifié | Non vérifié |
| tro_staking | `erd1qqqqqqqqqqqqqpgqes0a2kryurmt34g7nu4kx9n4ftj77dl5vhxqpe3xf3` | Oui / oui | false | Non vérifié | Non vérifié | Non vérifié | Non vérifié |
| tro_governance | `erd1qqqqqqqqqqqqqpgqe6xrgq2y53q8d0lsact2dppzvg42t4wcvhxq9e9euy` | Oui / oui | false | Non vérifié | Non vérifié | Non vérifié | Non vérifié |
| agent_stake_escrow | `erd1qqqqqqqqqqqqqpgqzyvwldu6jq8w6ry6s856dl0uy7g0v37vvhxqndvzr3` | Oui / oui | false | Non vérifié | Non vérifié | Non vérifié | Non vérifié |
| treasury_splitter | `erd1qqqqqqqqqqqqqpgq245sma97w0j9ga9jdgxu36zs0v8g0y6evhxq2nkezv` | Oui / oui | false | Non vérifié | Non vérifié | Non vérifié | Non vérifié |
| slot_casino | `erd1qqqqqqqqqqqqqpgquf3cuv2zsfsahy7ypvter3qcep4ptthsvhxqs4g34f` | Oui / oui | false | Non vérifié | Non vérifié | Non vérifié | Non vérifié |
| soul-zk-verifier | Aucune adresse épinglée dans ce registre | Non vérifié | Non vérifié | Non vérifié | Non vérifié | Non vérifié | Non vérifié |

L'API indique le même **account owner** pour ces neuf comptes : `erd1kex0pvp9dng8j76sgsejkyx86nhxuqk24my6wnha8dga9mymvhxqvl8v0g`, et isUpgradeable=true. Le propriétaire stocké par les contrats (ex. getOwner) n'a pas été interrogé et ne doit pas être déduit de ce champ. Aucune preuve multisig/MPC n'est établie par ces GET.

isPayable=false est une propriété du compte ; elle ne suffit pas, seule, à conclure sur la payabilité d'un endpoint de smart contract. Aucune transaction de test n'a été réalisée. L'état « déployé » ne vaut pas GO pour envoyer des fonds.

Aucun binaire .wasm/.mxsc.json correspondant à ces neuf produits n'a été identifié dans l'arbre Git relu. Il reste à produire la compilation reproductible épinglée, la vérification du code déployé et les scénarios réels adaptés au contrat.

## Gates LIA Simple et recette

| Contrôle | Preuve disponible | État |
| --- | --- | --- |
| Capacité réservée avant quoteProvider | Code de la branche capacité | Présent, pas une preuve de déploiement |
| Rejet concurrent immédiatement observé | Promise.allSettled attaché avant setImmediate ; maxRecords=1 | Test ajouté dans cette revue |
| Libération capacité/quota | Échec provider, Rule1 invalide, pause pendant l'attente, refus quota | Tests ajoutés dans cette revue |
| UI PAPER distincte du commerce | Vrai PackCheckout monté avec ports simulés ; préparation/confirmation via le service réel | Test ajouté ; ne couvre pas un navigateur public ou un login réel |
| Rule1 | Prix serveur 110/75/50 EUR, marge interne 4 %, TTL ≤30 s | Tests locaux ; taux réel/fraîcheur opérationnelle à vérifier |
| Guardian | Avant et après devis, puis à confirmation | Tests ; liaison au circuit-breaker de production à vérifier séparément |
| SIWX/JWT | Nouvelle route exige preuve wallet et issuer ; FULL non requis | Code #378 ; smoke wallet réel non réalisé |
| IPN Paybox / chaîne / My Packs | Non exécutés dans ce lot | Non vérifiés |
| Flags financiers runtime actuels | Aucun changement effectué ni nouvelle mesure attestée ici | Ne pas déduire leur état d'un env CI |
| CI Node 22 du nouveau HEAD | Attendre les logs SHA exacts de la PR | À compléter |
| Fusion et déploiement | Aucun réalisé dans ce lot | À vérifier séparément |

Commandes de recette :
```bash
node --test services/access-api/tests/lia-simple.test.mjs services/access-api/tests/lia-simple-http.test.mjs
node --test apps/frontend/tests/pack-checkout-paper.test.mjs
npm --prefix apps/frontend run typecheck
```

## Dette de cohérence et clés

- Réconcilier les neuf UNLOCK_JOBS avec les huit lignes de getAllScSnapshots() sans ouvrir de gate.
- Le fichier data/marketplace_codehash_live.json vise un ancien placeholder et une observation du 3 août ; ne pas l'utiliser comme état du marché courant.
- Distinguer LIA Ops, account owner, propriétaire applicatif, treasury bénéficiaire et wallet de connexion ; aucun n'est substituable.
- Revalider pipeline paiement/IPN → commande → job mint → livraison → droits ; les tests PAPER n'attestent aucune de ces écritures.
- Les répartitions, caps TRO et politiques de breaker doivent être rattachés à des configurations versionnées et des scénarios. Les pourcentages du résumé ne constituent pas des règles actives prouvées.
- Établir et faire revoir la gouvernance des clés/owners avant toute migration multisig/MPC ; ne pas modifier les permissions pendant cette revue.
- Stealth, Vampire, Predator grey-hat : aucun déploiement, financement ou mandat n'est inclus ou autorisé par cette checklist.

## Ordre de sortie

1. Revoir le correctif capacité, le test UI et les logs Node 22 du HEAD ; conserver la PR en brouillon jusqu'à revue indépendante.
2. Après autorisation distincte de fusion/déploiement, refaire le smoke PAPER sur les surfaces réellement publiées avec leur SHA.
3. Vérifier les contrats, signatures et droits opérateur, les devis/flags, la durabilité SQL et l'idempotence.
4. Seulement avec autorisation distincte : recette contrôlée PSP/chaîne/remboursement, rapprochement et My Packs.
5. Examiner une ouverture commerciale limitée séparément. Aucune activation de trading ou d'executor ne découle de ces étapes.

**Verdict de cette revue :** PAPER sans fonds admissible aux vérifications locales et CI ; disponibilité publique à mesurer. **Aucun GO tip** établi : bénéficiaire, réseau et parcours de don restent à attester. **NO-GO activation fonds / executor live sur la seule base de ce document.**
