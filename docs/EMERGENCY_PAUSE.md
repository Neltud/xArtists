---
hidden: true
noIndex: true
---

# Emergency pause — xArtists mainnet SC

Révision documentaire : 28 octobre 2026, audit `352de2dc…`. Ce runbook ne constitue pas un GO pour envoyer une transaction, changer une clé ou redéployer. Chaque action de mutation exige l'opérateur autorisé et son approbation sur la cible précise.

### 1. Détecter et conserver les preuves

Déclencheurs : hash/owner inattendu, comportement financier anormal, corruption du ledger ou de l'état de risque, paiement non rapproché, signature inattendue ou service de confiance indisponible.

Relever UTC et Europe/Paris, commit, build servi, chaîne, adresse exacte, requête/réponse et identifiants de commande/TX. Exporter des journaux sans secrets ni données personnelles inutiles. Ne pas réinitialiser le fichier corrompu, effacer les commandes ou relancer une livraison ambiguë.

Les lectures `ops_sc_watch` et explorer peuvent aider ; un résultat manquant n'est pas un état sûr. Ne pas transformer une erreur d'indexer en succès.

### 2. Arrêter les chemins hors chaîne

L'opérateur suspend les exécuteurs, tâches de signature et entrées d'ordre concernés. Le rapport quotidien alerte mais n'effectue pas cette mutation. Conserver LIA en paper et fermer le checkout visé ; bloquer la création de nouvelles commandes tout en gardant un chemin de rapprochement des paiements déjà reçus.

Les flags frontend exigent un rebuild pour modifier un ancien bundle. Fermer l'UI ne ferme ni l'API ni les appels directs au contrat. Une API ou base indisponible ne doit pas créer un nouveau ledger vide.

### 3. Pause contractuelle, par ABI et par pouvoir

`isPayable=false` concerne la réception native selon les métadonnées du compte : ce n'est pas une preuve de pause de ses endpoints payables, ni un arrêt HTTP. Vérifier les endpoints, l'ABI et les protections réellement déployés avant de conclure.

| Cible de l'inventaire                                                                                                          | Lecture du 28 octobre                | Conséquence                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------------- |
| agents\_marketplace, nft\_marketplace, nft\_staking, tro\_staking et legacy, tro\_governance, treasury\_splitter, slot\_casino | `isPaused` répond `ok`, false encodé | Une pause n'est pas attestée par ces réponses                                   |
| venue\_split, agent\_stake\_escrow                                                                                             | `isPaused` : function not found      | Identifier la vue réelle et son ABI ; ne pas assimiler l'erreur à true ou false |

Les adresses de référence et hashes figurent dans `data/contracts.json`. Un hash égal à cette référence ne prouve pas un build reproductible.

Avant une pause réelle : double vérification du réseau et de l'adresse, ABI correspondant au bytecode, owner métier et owner blockchain, signataire approprié, effet sur retraits/refunds en cours et méthode de vérification après confirmation. Le `setPaused` métier et le pouvoir d'upgrade du compte sont distincts. Aucun exemple prêt à diffuser n'est exécuté par cet audit.

La préparation peut être faite sans signature ni broadcast. Le responsable donne ensuite le GO sur l'opération ; le signataire garde les clés hors Git, chatbot, GitBook et runner de build.

### 4. Rapprocher et contenir

Lister les commandes et TX à statut incertain. Rechercher un identifiant fournisseur avant toute nouvelle tentative. Geler la livraison ou le paiement sortant concerné ; les remboursements, transferts, upgrades et rotations sont des décisions séparées, avec preuve d'autorité.

Ne pas lancer claimFees pendant l'incident sans décision explicite et destination vérifiée. Ne pas corriger un incident par un upgrade non reproductible. Une clé potentiellement exposée n'est pas recopiée dans un nouveau fichier partagé.

### 5. Reprendre

Cause et périmètre établis, correctif relu au SHA exact, tests de panne/concurrence verts, état financier rapproché et restauration vérifiée. Revalider hash/ABI/owners et confirmer séparément l'état du contrat, du serveur et du bundle servi.

Le responsable et le vérificateur approuvent la capacité exacte à reprendre ; un cron ou un badge ne réactive rien. Documenter le retour à l'état fermé. Tout doute sur la livraison ou le budget garde le chemin concerné fermé.

[Audit et preuves](security/audit-2026-10-28.md) · [Critères de lancement](security/launch-gates.md)
