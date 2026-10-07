# Ambiance audio muséale

## Mapping

| Zone | Route | Fichier |
|------|-------|--------|
| Accueil | `#/` | `public/audio/mars_gallery.mp3` |
| Command / LIA | `#/command-center`, `#/lia` | `public/audio/elixir_command.mp3` |
| Musée / TCA | `#/museum`, `#/tca`, salles | `public/audio/persic_museum.mp3` |

## Comportement

- Bouton **Musique** → unlock autoplay + mute
- Changement de route → fade-out / fade-in
- MP3 absent → **échec silencieux** (pas d’erreur console bloquante, canvas 3D intact)
- Plus de YouTube dans le player d’ambiance

## Déploiement assets

```bash
mkdir -p apps/frontend/public/audio
cp Mars.mp3 apps/frontend/public/audio/mars_gallery.mp3
cp "01 Elixir.mp3" apps/frontend/public/audio/elixir_command.mp3
cp "persic shit.mp3" apps/frontend/public/audio/persic_museum.mp3
git add apps/frontend/public/audio/*.mp3
git commit -m "assets: zone ambience MP3"
```
