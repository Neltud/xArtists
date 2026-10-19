# Publish Sites v3 exact — action required

Local commits with **751 exact frontend files** exist but full `git push` needs your GitHub credentials.

## Bundle (4.2 MB)
Path in agent environment (if still available):
`/home/workdir/artifacts/xartists-sites-v3-exact.bundle`

Commits:
- `4b2026d` — exact Sites UI (751 files)
- `73099d5` — GitHub Pages base `/xArtists/`

## One-liner (on your machine)

```bash
git clone https://github.com/Neltud/xArtists.git && cd xArtists
# Place the bundle, then:
git fetch /path/to/xartists-sites-v3-exact.bundle 'codex/xartists-sites-v3-exact:codex/xartists-sites-v3-exact'
git push -u origin codex/xartists-sites-v3-exact
```

Or re-run extract + import:

```bash
python3 XARTISTS_SITES_V3.py --extract-dir xartists-sites-v3
python3 xartists-sites-v3/IMPORT_IN_REPO.py ./xArtists
# apply hosting base /xArtists/
git push -u origin codex/xartists-sites-v3-exact
```

Then open PR → main after `npm run build` + scripts check.
