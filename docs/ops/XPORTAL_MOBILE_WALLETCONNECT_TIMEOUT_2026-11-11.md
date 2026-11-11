# xArtists — diagnostic xPortal WalletConnect du 11 novembre 2026

## Symptôme et preuve

Sur Android et sur une session navigateur non authentifiée, le clic **xPortal / WalletConnect** affiche « Initialisation WalletConnect… » puis échoue par timeout **avant affichage d'une URI ou d'un QR**. Reproduit en lecture UI sur https://xartists.art/explore/market?buy=2. Le smart-contract marketplace / listing #2 n'est pas en cause : le blocage est **avant toute connexion ou transaction**.

## Atténuation livrée par la PR

- Tentative de pairing sur `wss://relay.walletconnect.com`; si la phase d'initialisation / création de pairing échoue sans URI, tentative sur le relais officiel secondaire `wss://relay.walletconnect.org`.
- Chaque phase (init et connect) a un délai max de 12 secondes. Quand les deux relais échouent, message explicite, et l'utilisateur garde la possibilité de retenter.
- Les refus liés à une autorisation / projectId / domaine (401, 403, forbidden, origin) restent **bloquants** : aucune bascule ne contourne le contrôle d'identité du projet.
- Un bouton **Annuler la connexion xPortal** est affiché pendant l'attente. La fermeture annule aussi la session ; une approbation tardive ne peut pas enregistrer un wallet après fermeture.
- La signature, les achats et le paiement **ne sont jamais automatisés**. Le wallet utilisateur doit autoriser toute connexion et tout achat.

## Vérifications ops hors code

1. Dans la console WalletConnect/Reown du **projet officiel contrôlé par xArtists**, vérifier que le `VITE_WALLETCONNECT_PROJECT_ID` configuré est actif et que `xartists.art` et `www.xartists.art` figurent parmi les domaines autorisés. Ne jamais envoyer de clé secrète dans une PR ou ChatGPT. Un projectId public n'est pas une clé privée, mais ne pas le remplacer par un projet tiers non validé.
2. Comparer le comportement en Chrome Android et dans la WebView de l'application de messagerie. La fenêtre personnalisée du navigateur intégré peut empêcher les liens d'application.
3. Au clic après génération de la nouvelle URI, l'utilisateur ouvre xPortal avec le bouton prévu ; une session doit être approuvée **dans l'application xPortal**. Aucun bouton « lecture seule » ne constitue une authentification.
4. Avant de présenter un achat comme complet, contrôler `buyNft@02`, la transaction confirmée sur MultiversX Explorer et la détention de `ASFT-a6273a-01` par le wallet acheteur. `LIA_LIVE_TRADING=0`, agents et PayBox restent fermés.

## État de preuve

Un test CI et une build ne prouvent pas une authentification réelle xPortal sur un Android utilisateur. La validation finale exige un retour utilisateur **sans communiquer de phrase de récupération**, puis, après achat volontaire, un hash public de transaction.
