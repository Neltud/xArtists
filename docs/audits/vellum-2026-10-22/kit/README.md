# Transférer V3 avec un connecteur Contents

Ce kit prépare une archive compressée des différences entre une branche distante et son merge local complet. Le connecteur n’envoie que quelques morceaux, un manifeste et un petit workflow. GitHub Actions applique les sources et pousse un commit avec son jeton natif. Aucun PAT à communiquer au modèle n’est nécessaire si les permissions du dépôt autorisent cette opération.

Le kit ne publie pas directement le site. Il importe les sources sur `fix/v3-complete-release`, puis lance `static.yml` sur cette branche pour validation. La PR, sa fusion et le déploiement final suivent après les contrôles.

**Statut 2026-10-22 :** V3 est déjà sur `main` (PR #180). Ce kit est archivé sous `docs/audits/vellum-2026-10-22/kit/` pour traçabilité des lots (552 fichiers / 14 parts). Ne pas réappliquer sur main.

## Préparer le merge

Réutiliser le merge V3 complet déjà présent dans le terminal de Grok. Récupérer la dernière branche distante et l’intégrer au merge local. Le commit local final doit descendre du commit distant utilisé comme base, contenir tous les fichiers et avoir un arbre de travail versionné propre.

Les fichiers de verrouillage doivent être suivis par Git. Le préparateur contrôle aussi leur correspondance avec les dépendances directes de `package.json`.

```bash
git fetch origin main fix/v3-complete-release
git merge origin/main
git merge origin/fix/v3-complete-release
git merge-base --is-ancestor origin/fix/v3-complete-release HEAD
```

Résoudre les éventuels conflits et vérifier le contenu final avant la préparation. Ces commandes ne poussent rien.

## Générer les fichiers de transport

Depuis un dossier où le kit est extrait, fournir le chemin du clone qui contient le merge complet et choisir un dossier de sortie vide :

```bash
python3 prepare.py \
  --repo /chemin/du/clone/xArtists \
  --base origin/fix/v3-complete-release \
  --ready HEAD \
  --out /chemin/vers/transport-v3
```

Le rapport indique le nombre réel de fichiers transportés et de morceaux produits. Un morceau représente au plus 349 528 octets de texte ; même son encodage Base64 supplémentaire pour l’API Contents reste sous 467 Ko.

Les fichiers `.github/workflows/*` sont exclus du patch : le jeton du runner ne sert pas à réécrire ses workflows. Le manifeste indique les versions nécessaires, notamment celle de `static.yml`. Le connecteur doit synchroniser ces fichiers séparément avec le merge final avant le lancement si nécessaire.

## Vérifier et terminer

Le runner vérifie les SHA-256, la base Git, l’absence de modifications concurrentes des sources, les workflows attendus et les empreintes Git des fichiers importés. Il applique le patch après un contrôle préalable, supprime les fichiers de transport et pousse sans forcer. Un conflit ou un manque de permission fait échouer l’étape explicitement.

Voir `VALIDATION.md` pour les lots vérifiés (552 / 14 / empreintes).
