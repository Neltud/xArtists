# Socle exécutable v0.2 — simulation locale

## 1. Registre central des droits

`scripts/rights_registry.py` fournit `SimulationRegistry`, une base SQLite unique pour les quatre plateformes. Les publications renvoient à l'empreinte du même fichier source. Les réservations et contrôles de conflit sont exécutés dans une même transaction d'écriture. Le conflit est recherché sur la période, les droits, les canaux et les pays dès qu'une des deux licences est exclusive. Deux licences non exclusives restent possibles. Le consentement porte sur l'empreinte de la proposition entière, incluant prix et royalties, et sa version est immuable.

Périodes semi-ouvertes [début,fin), fin null = durée ouverte. Une réservation expire après son TTL ; un contrat simulé conserve son verrou jusqu'au terme du droit. Les contrats réels, droits antérieurs et licences de plateformes doivent être importés et revus avant toute ouverture. Le registre ne découvre pas les licences conclues ailleurs.

Limites : ce prototype n'authentifie aucun acteur, ne vérifie aucune signature et n'est pas un serveur. Les appels `approve`, `mock_connect` et `mock_contract` constituent des fixtures de simulation uniquement. Le journal SQL est transactionnel mais n'est pas inviolable. Les empreintes ne détectent pas les recadrages/transcodages : une revue doit rattacher les dérivés à une même famille de droits. Pour le MVP, les pays doivent être normalisés par un référentiel revu ; les territoires régionaux/hiérarchiques sont refusés. Les droits et canaux utilisent des catégories conservatrices ; toute portée inconnue bloque le traitement.

Exécution des tests : depuis le répertoire de cette compétence, `python -m unittest discover -s scripts -p 'test_registry.py' -v`. Aucune base client réelle n'est incluse dans le package. Tous les tests utilisent des fichiers temporaires.

## 2. Connexions créateurs — contrat à implémenter

| Objet | Preuve et contrôle requis côté serveur |
|---|---|
| Connexion sociale | Fournisseur/région, identifiant stable du compte, callback autorisé exact, protection CSRF state à usage unique, PKCE lorsque le fournisseur le supporte, scopes minimaux vérifiés et expiration |
| Session xArtists | Identité authentifiée, session courte et rôle/mandat ; aucun booléen navigateur ne fait autorité |
| Secret OAuth | Jeton chiffré côté serveur ; jamais dans listing, journal, prompt ou localStorage ; rotation/révocation |
| Accord de listing | Créateur + empreinte de l'offre complète + version + canaux approuvés + horodatage + preuve d'approbation authentifiée |
| Autorité sur le contenu | Dossier séparé de la connexion : auteur, co-auteurs, musique, personnes, droits antérieurs et pouvoir de céder |

Les quatre connecteurs sont **non implémentés**. `mock_connect` ne les remplace pas. Une révocation bloque de nouvelles opérations mais n'annule pas automatiquement les contrats existants. Un callback forgé, un compte substitué, un state rejoué, des scopes insuffisants ou un consentement sur une autre version doivent échouer avant toute publication. Ne pas inventer scopes, endpoints ou autorisations des plateformes : vérifier leur documentation officielle lors de l'intégration.

## 3. Paiement et livraison — contrat à implémenter

Une commande immuable lie `orderId`, `buyerId`, `creatorId`, `assetHash`, `proposalDigest`, `contractDigest`, rail, devise, réseau, montant exact en unités entières et date limite. Prix et royalties sont dérivés de l'offre approuvée côté serveur. En cas de double écriture impossible avec le PSP : réserver puis outbox/idempotence et réconciliation, jamais supposer une transaction distribuée.

| Événement | Preuve nécessaire | Transition |
|---|---|---|
| Retour navigateur | Aucune autorité financière | Aucun droit activé |
| Callback PSP | Signature vérifiée sur les octets reçus, clé/fournisseur attendus, eventId unique, commande/montant/devise liés, statut vérifié et réconciliation | `payment_confirmed` seulement |
| Bitcoin on-chain | Réseau attendu, destinataire et montant, tx/outpoint liés à une commande unique, finalité selon politique explicite, traitement réorganisation | `payment_confirmed` seulement |
| Lightning | Facture réelle liée à commande/montant/expiry/paymentHash ; preuve de règlement par backend authentifié ; idempotence | `payment_confirmed` seulement |
| Livraison privée | Contrat exécuté + paiement confirmé + reçu horodaté, hash du fichier, acheteur et durée d'accès, référence de stockage protégée | `delivered` |
| Activation | Toutes les preuves précédentes liées à la même commande/version ; aucun litige bloquant ; période valide | `active` |

Un événement dupliqué produit le même résultat, une clé rejouée avec un autre contenu est rejetée. Le paiement ne prouve pas la livraison, une URL de fichier ne prouve pas sa réception, et une expiration n'efface pas les copies téléchargées. Prévoir remboursement, litige et chargeback sans promesse d'effacement ni nouvelle facturation automatique.

Les adaptateurs financiers et la livraison sont **non implémentés**. `activate()` échoue toujours avec `LIVE_DISABLED`. Aucun paiement réel, droit serveur, mint ou abonnement n'est activé par cette version. Tests d'intégration futurs obligatoires : signatures falsifiées, mélange GET/POST Paybox, mauvaise devise/réseau, rejeu, retard, confirmation Lightning falsifiée, réorganisation, livraison absente et remboursement.
