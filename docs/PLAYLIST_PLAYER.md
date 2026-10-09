# Playlist player (SoundCloud / YouTube)

## Composant

`PlaylistPlayerModal.tsx` — modal glass + lecture **en fond** si la modal est fermée.

## Config

`apps/frontend/src/config/playlist.ts`

| Variable env | Effet |
|--------------|--------|
| `VITE_PLAYLIST_URL` | URL SoundCloud ou ID / URL YouTube |
| `VITE_PLAYLIST_PROVIDER` | `soundcloud` \| `youtube` |

Défaut : YouTube lofi (`jfKfPfyJRdk`).

## UX

1. Bouton **🎵 Activer** (bas-droite)
2. Modal embed · **Continuer en fond** ferme l’UI sans stopper l’audio
3. **Ouvrir player** rouvre la modal
4. **Stop musique** coupe l’iframe

## Mobile

FAB au-dessus de la BottomNav. Pas de MP3 dans le repo.
