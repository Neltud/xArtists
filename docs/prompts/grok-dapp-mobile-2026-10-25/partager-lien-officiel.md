---
description: >-
  Correctif obligatoire du lien public, des boutons Copier et Partager et du QR
  : GitHub Pages uniquement.
hidden: true
noIndex: true
---

# Lien public et QR — GitHub Pages uniquement

Instruction de Nelson du 25 octobre 2026 : les liens publics xArtists doivent utiliser GitBook ou GitHub.

### Adresses publiques à utiliser

* Dapp : **https://neltud.github.io/xArtists/**
* Présentation : **https://xartists.gitbook.io/xartists/presentation**
* Code : **https://github.com/Neltud/xArtists**

Le contrôle HTTP a confirmé que l’adresse principale de la dapp répond 200. La route `/xArtists/app/` répond encore 404 : utiliser la racine GitHub Pages dans les liens à partager. Conserver le paramètre `?lang=fr` ou la langue sélectionnée.

### Ordre d’application

Conserver l’ordre déjà autorisé : import mobile et ses 26 empreintes → suppression du workflow d’import → retrait polyLIA et validation → **ce correctif de lien public** → checks → merge → contrôle Pages.

Ce correctif est une évolution autorisée après vérification de l’import. Ne pas modifier les archives, morceaux, manifestes ou empreintes des imports existants pour y intégrer ce changement.

### Une seule ligne à remplacer

Fichier : `apps/frontend/src/pages/DappAccessPage.tsx`.

Lire le fichier actuel dans la branche cible, conserver ses autres modifications, puis remplacer exactement une occurrence de :

```typescript
    const link = new URL('app/', new URL(import.meta.env.BASE_URL, window.location.origin))
```

par :

```typescript
    const link = new URL('https://neltud.github.io/xArtists/')
```

La ligne suivante `link.searchParams.set('lang', lang)` reste présente. Le champ affiché, Copier, Partager et le QR doivent tous utiliser cette même URL.

```json
{
  "format": "xartists-public-link-edit-v1",
  "repository": "Neltud/xArtists",
  "file": "apps/frontend/src/pages/DappAccessPage.tsx",
  "expected_occurrences": 1,
  "find": "    const link = new URL('app/', new URL(import.meta.env.BASE_URL, window.location.origin))",
  "replace": "    const link = new URL('https://neltud.github.io/xArtists/')",
  "complete_kit_before_sha256": "f0db017a92ab28c82376da5ea137699bafa093a7852a27a82f974263eac67c6c",
  "complete_kit_after_sha256": "c429b9b1542c40236452f0e79ad65ad19dc47f3aff649dda4587a8c6222b9680",
  "canonical_url": "https://neltud.github.io/xArtists/",
  "public_docs_url": "https://xartists.gitbook.io/xartists/presentation",
  "preserve_query_language": true
}
```

Les deux SHA-256 ci-dessus concernent la version complète locale du kit. Si le fichier a évolué dans GitHub, lire ses différences et ne conserver que cette substitution ; ne pas écraser le fichier avec une autre variante. Pour un envoi via Contents API, récupérer son blob SHA courant, modifier le contenu intégral en mémoire, puis fournir ce SHA à la mise à jour.

### Vérifications réalisées localement

* 22 tests de release passent.
* 36 modules, 51 alias, 97 routes ; aucun import non résolu.
* Build terminé avec `VITE_LIA_LIVE_TRADING=0` et `VITE_PAYBOX_ENABLED=false`.
* 24 contrôles du composant réel : 3 origines et 8 langues ; le champ, Copier, Partager et l’image QR correspondent tous à l’URL GitHub attendue.
* Exemple français : **https://neltud.github.io/xArtists/?lang=fr**
* Commit source local : `55605730d6df7701839bedfd219fcefc9df80dd5`, pas encore poussé dans GitHub.

### Finalisation côté GitHub

Appliquer la modification dans la branche complète après les imports. Exécuter les checks frontend et le build paper, puis publier un commit normal. Le contrôle final doit vérifier le lien affiché, le contenu du partage et le QR sur la version GitHub Pages déployée.

L’intégration GitHub de Codex a retourné 403 à la création de la branche de correctif ; aucune modification de code n’a été poussée par Codex dans Neltud/xArtists. La présentation publique GitBook a été corrigée séparément.

Ce correctif ne déclenche aucune transaction financière et ne change pas les autorisations des portefeuilles.
