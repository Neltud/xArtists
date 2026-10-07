# Zone ambience

Prefer full MP3:
- mars_gallery.mp3
- elixir_command.mp3
- persic_museum.mp3

Fallback: `*.b64` (base64 of 20s loops) decoded at runtime if MP3 404.

To replace with full tracks from Neltud:
```bash
cp Mars.mp3 apps/frontend/public/audio/mars_gallery.mp3
cp "01 Elixir.mp3" apps/frontend/public/audio/elixir_command.mp3
cp "persic shit.mp3" apps/frontend/public/audio/persic_museum.mp3
```
