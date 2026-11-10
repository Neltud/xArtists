# xArtists.art — bascule GitHub Pages (PREP — 10 novembre 2026)

**But :** servir la dApp existante sur **https://xartists.art/**, avec **https://www.xartists.art/** redirigé vers le domaine principal et **HTTPS valide**. Aucun transfert de l'API Render, du PostgreSQL, d'IPFS ou des contrats MultiversX ; aucun checkout/mint/abonnement activé.

**État initial vérifié en lecture seule le 10/11** via le résolveur DNS Google :

- Domaine **xartists.art** : A **51.91.236.255** (OVHcloud), TTL 3600.
- `www.xartists.art` : **aucun CNAME (NXDOMAIN)**.
- MX de l'apex : **1 mail.xartists.art**. L'existence du MX ne prouve pas que la boîte fonctionne.
- DApp de référence : https://neltud.github.io/xArtists/ (React/Vite, déploiement GitHub Actions).
- Depuis l'hébergement OVH, le certificat était associé au cluster129 et la page d'attente OVH ; aucun certificat public valide `xartists.art` attesté dans cette lecture.
- La version actuellement servie par GitHub Pages utilise un **base path /xArtists/** ; ne pas se contenter de changer les DNS sans publier un build destiné à **/**.

## Séquence de raccordement — en respectant la zone de messagerie

### 1) Confirmer la propriété / la cible GitHub avant de modifier les DNS

Ouvrir **https://github.com/Neltud/xArtists/settings/pages** depuis un compte GitHub disposant des droits administrateur.

- GitHub Pages doit publier depuis **GitHub Actions**, workflow `.github/workflows/static.yml` ; ne pas basculer sur une branche `docs/` ni supprimer le site actuel.
- Dans **Custom domain**, enregistrer **`xartists.art`** (sans https ni /xArtists). Si GitHub propose la vérification du domaine du propriétaire, suivre le TXT fourni dans GitHub (ne jamais inventer le token) **avant** le raccordement.
- La documentation GitHub précise que pour un déploiement via Actions, un fichier `CNAME` **ne configure pas** le domaine et peut être ignoré. C'est **Settings → Pages** qui fait foi.
- Vérifier la présence du compte GitHub `Neltud` et du repo `xArtists` dans les paramètres : une autre repo peut provoquer un conflit de propriété du domaine.

**L'enregistrement de ce domaine peut entraîner une redirection de l'ancien site GitHub Pages vers le nouveau domaine. Effectuer l'étape DNS au même moment pour limiter une interruption.**

### 2) DNS OVHcloud : changer **seulement** le web

Dans **OVHcloud → Web Cloud → Noms de domaine → xartists.art → Zone DNS** :

| Type | Nom / sous-domaine | Valeur cible | Action |
|---|---|---|---|
| A | `@` (champ vide, apex) | `185.199.108.153` | Ajouter |
| A | `@` | `185.199.109.153` | Ajouter |
| A | `@` | `185.199.110.153` | Ajouter |
| A | `@` | `185.199.111.153` | Ajouter |
| A | `@` | `51.91.236.255` | **Remplacer/supprimer UNIQUEMENT l'ancien A de l'apex** après ajout des quatre adresses GitHub |
| CNAME | `www` | `neltud.github.io.` | Ajouter ; **sans /xArtists/** |
| AAAA | `@` | Aucune requise pour ce passage (IPv4 suffit) | **Examiner** et éliminer seulement l'éventuelle ancienne IPv6 de la page OVH si elle existe, sans toucher aux autres noms |

**Ne pas modifier** : NS `dns107.ovh.net / ns107.ovh.net`, SOA, MX, `mail.xartists.art`, TXT SPF, DKIM, `_dmarc` ou les enregistrements d'authentification/validation non liés au web. Sauvegarder une capture/export de la zone **avant et après**. Aucun wildcard `*` CNAME/A. Ne pas désactiver ni supprimer le service mail OVH ni créer de MySQL.

> Références : [DNS GitHub Pages officiels](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site), [OVHcloud CNAME](https://docs.ovhcloud.com/fr/guides/web-cloud/domains/dns-zone-cname-record-creation).

### 3) Déployer uniquement le build racine, protégé par les contrôles

- Préparer et vérifier **PR de bascule** `feat/p0-xartists-art-github-pages-apex-cutover-20261110` : Vite `base: '/'`, BrowserRouter basename issu de `BASE_URL`, PWA / favicon / sitemap / canonicals `xartists.art`, deep links et scripts de vérification des artefacts.
- Le workflow de déploiement **refuse** de publier la build racine si `Settings → Pages` n'a pas encore `cname=xartists.art`, si l'un des quatre A GitHub manque, s'il reste l'IP OVH dans l'apex ou si `www` ne cible pas `neltud.github.io.`. Ce blocage évite une publication incompatible avec la situation DNS.
- Le workflow doit passer en build / front-end safety / tests de routes **avant** fusion. Les autres PR UX restent séparées ; aucune activation d'achat ne résulte de cette bascule.
- Un fois le domaine GitHub et le DNS vérifiés, **fusionner** la PR de bascule après revue puis valider le workflow GitHub Pages sur son SHA réel. **Ne pas fusionner avant la configuration DNS et GitHub Pages**.

### 4) Recette de production HTTPS / pages / wallet

- `https://xartists.art/` : HTTP 200, certificat **au nom xartists.art**, logo/styles, home en mode clair et UI mobile.
- `https://www.xartists.art/` : redirection HTTPS vers `https://xartists.art/`.
- Pages directes `/offres/`, `/packs/pulse/`, `/packs/yield/`, `/packs/sentinel/`, `/museum/`, `/studio/`, `/marketplace/` : HTTP 200 et JS/CSS répondant sur **/assets/**, jamais **/xArtists/assets/** ; pas d'écran blanc.
- `/build-info.json` : SHA du dernier workflow de publication attendu et `base_url: "/"`. `/dapp-release.json` : `base_path: "/"` et tous les routes déclarés.
- `/manifest.webmanifest`, `/robots.txt`, `/sitemap.xml`, SEO canonical et OG/Twitter : domaine `xartists.art`.
- GitHub **Settings → Pages → Enforce HTTPS** : activer seulement quand le certificat dédié est émis et valide.
- **WalletConnect / xPortal** : ajouter `https://xartists.art` à la liste des domaines/origines du projet WalletConnect chez le fournisseur, et tester retour de signature en environnement **non transactionnel**. Le nouveau domaine ne prouve pas l'origine du wallet ou la capacité de mint.
- Conserver les enregistrements mail et vérifier l'émission/réception avant de publier `hello@xartists.art`.

## Rollback, non financier

Si la publication du domaine échoue : revenir au site de découverte existant après revue, sans toucher aux données Render/PostgreSQL. Ne pas retourner uniquement les DNS vers OVH si GitHub Pages conserve un domaine personnalisé conduisant à des redirections cassées ; l'enchaînement DNS et Pages doit être cohérent.

**Statut actuel : PR préparatoire, aucune modification OVH/GitHub Pages Settings appliquée ici.** Domaine non certifié pour les visiteurs jusqu'aux contrôles complets. Les rails Stripe, EGLD/NFT, MoonPay, PayBox, Finance Computer et LIA trading restent **NO-GO**.
