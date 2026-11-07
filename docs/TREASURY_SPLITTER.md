---
hidden: true
noIndex: true
---

# Treasury Splitter — règle, pas un solde

**Contrat :** `contracts/treasury-splitter`  
**Déploiement :** aucun. Pas d'adresse mainnet.  
**Règle d'init prévue par** `scripts/deploy_treasury_splitter.sh` : Mission 40 % · Réserve 30 % · Récompense 20 % · Ops 10 % (`4000/3000/2000/1000`).

Le contrat n'encode pas ces pourcentages en dur. `init` reçoit quatre adresses et quatre bps dont la somme doit être 10 000. `setSplitBps` peut les changer ensuite, owner seulement. Le reste de poussière part dans Ops.

Ce n'est pas :

- le TRO brûlé (`burnt` du jeton `TRO-94c925`) ;
- la redistribution TRO 40/30/20/10 pool / stake / rewards / burn ;
- un solde déjà réparti. Mission, Réserve et Récompense n'ont pas d'adresse (`CREATE_REQUIRED`).

`docs/TREASURY_SPLITTER.md` indiquait auparavant un split à trois seaux 40/30/30. C'était faux par rapport à `lib.rs` et au script de déploiement. Ne pas redéployer depuis cette note.
