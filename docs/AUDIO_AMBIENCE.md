# Ambiance audio muséale

## Pistes (fournies par Neltud)

| Zone | Fichier source | Cible repo |
|------|----------------|------------|
| Accueil / galerie / TCA | `Mars.mp3` | `apps/frontend/public/audio/mars_gallery.mp3` |
| Command Center + LIA | `01 Elixir.mp3` | `apps/frontend/public/audio/elixir_command.mp3` |
| Musée | `persic shit.mp3` | `apps/frontend/public/audio/persic_museum.mp3` |

## Déploiement

```bash
mkdir -p apps/frontend/public/audio
cp "Mars.mp3" apps/frontend/public/audio/mars_gallery.mp3
cp "01 Elixir.mp3" apps/frontend/public/audio/elixir_command.mp3
cp "persic shit.mp3" apps/frontend/public/audio/persic_museum.mp3
git add apps/frontend/public/audio && git commit -m "assets: zone ambience MP3"
```

Ou CDN :

```
VITE_AUDIO_GALLERY_URL=https://…/mars_gallery.mp3
VITE_AUDIO_COMMAND_URL=https://…/elixir_command.mp3
VITE_AUDIO_MUSEUM_URL=https://…/persic_museum.mp3
```

## Comportement

- Bouton **Musique** → unlock autoplay + mute/unmute
- Changement de route → **fade-out / fade-in** vers la piste de zone
- Loop HTML5, pas de YouTube

## Code

- `hooks/useGalleryAudio.ts`
- `config/nelsonAudio.ts` (`zoneFromPath`)
- `BackgroundMusicPlayer.tsx`
