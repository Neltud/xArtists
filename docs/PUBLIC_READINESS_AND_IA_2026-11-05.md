# xArtists — Architecture publique, états des modules et animation d'accueil

**Édition : 5 novembre 2026.** Ceci est un contrat de présentation honnête, pas un « GO » financier.

## Problème corrigé

Dans l'expérience précédente, la différence entre un **module accessible**, un **module principal**, une **démonstration** et une **capacité effectivement activée** n'était pas claire. 40 routes apparaissaient presque au même niveau et la navigation mobile superposait trop de liens.

## Architecture progressive

**Navigation desktop :** Découvrir · Créer · Marketplace · DAO · Feuille de route. La recherche globale et « Tous les modules » dans l'accueil, le footer et le menu mobile donnent accès à toutes les autres fonctions.

**Navigation mobile :** dock stable cinq destinations Accueil · Marketplace · Enchères · Studio · DAO, inchangé. Le menu étendu classe les liens en « À consulter », « En aperçu », « En préparation », « Tous les modules ». Les alias et routes anciennes restent conservés.

**Accueil :** présentation art-first et quatre intentions compréhensibles (découvrir, créer, collectionner, participer), chacune accompagnée du statut réel; un accès explicite à la feuille de route; les explications techniques et réseaux sont secondaires. Ne demander aucun wallet avant la consultation.

**Annuaire / pages de groupe :** le registre `publicReadiness.ts` classe chaque module; les groupes sont rangés de façon décroissante d'utilisabilité. L'annuaire filtre par statut sans supprimer aucune route. Les fiches portent un badge qui ne doit jamais prétendre qu'une transaction est active.

## Niveaux de maturité

| Niveau éditorial | Sens exact | Exemples |
| --- | --- | --- |
| **À consulter** (`browse`) | Présentation, navigation, lectures publiques ou accès wallet en consultation. Ni achat ni mint implicite. | Musée, Maison, Marketplace lecture, aide, informations $TRO, statut |
| **En aperçu** (`preview`) | Démonstration, préparation ou simulation, y compris valeurs fictives ou locale. | Studio mint, NFT Factory, Enchères, RWA, DAO locale, LIA paper |
| **En préparation** (`roadmap`) | L'interface explique l'intention mais aucune action financière / mutation n'est attestée. | Trading, staking, pools, bridge, burn, vente |

**Précaution :** cette classification est *éditoriale et conservatrice*, pas un service de capacités à jour. Une opération future ne sera déclarée « disponible » que sur la base de preuves backend vérifiées, datées et auditables. Le mode `browse` ne garantit ni disponibilité des API tiers ni conformité du contenu de chaque page interne; les contrôles de production restent fail-closed.

## Feuille de route publique

`/roadmap` (alias `/feuille-de-route`) affiche sans date artificielle :

- Mint + livraison NFT, avec stockage sécurisé, preuve S1/S2 et propriété réelle (#281).
- Paiement EUR/crypto, quote signée, réconciliation et remboursements (#370).
- Listings Solana / Polygon natifs, distincts de la découverte OpenSea (#391).
- Vote DAO on-chain, pouvoir strictement proportionnel au **$TRO staké** et audit (#393).
- Collatéral, liquidité et bridge $TRO après contrôle émetteur (#298).
- Mandats signés et protections anti-rejeu des agents exécutants (#369).

Le détail des dépendances et états de sécurité est conservé dans les issues. Aucune activation des flags commerciaux ni distribution de fonds dans cette refonte.

## Animation artistique « Atelier orbital »

Ornement purement visuel : trois cadres abstraits orbitent lentement autour du signe xArtists avec CSS `perspective` / `translateZ`. **Pas de WebGL, flux supposé LIVE, musique, image distante ni portefeuille.** `prefers-reduced-motion` et le choix « arrêter le mouvement » immobilisent les cadres. Le décor disparaît sur petit écran afin de conserver exactement le bon parcours responsive.

## Vérification avant publication

Maintenir strict TypeScript, build, tous les contrats frontend, navigation vers les modules, route `/roadmap` en direct, 360/390/430/1440 px, fonctionnement clavier, préférence de mouvement, tests de non-transaction. Vérifier le SHA réellement servi par Pages après fusion et les deux services Render.

Le feu vert **visuel / navigational** ne peut pas remplacer la preuve d'un mint humain réel, d'une facture réconciliée ou d'un vote DAO sur la chaîne.
