# P1.2 — Nested copy hygiene (`xArtists-master/`)

**2026-09-15**

## Problem (audit)

A nested folder `xArtists-master/` (typical GitHub zip extract) was reported in earlier audits (~90+ files). Risk:

- Editing the wrong tree
- Duplicate docs/status claims
- Repo weight / confusion for CI

## Current policy

| Item | Policy |
|------|--------|
| `xArtists-master/` | **Forbidden** on `main` |
| `.gitignore` | Must list `xArtists-master/` and `archive/` |
| Accidental local zip | Keep local only; never `git add` |

## Verify

```bash
# must print nothing
git ls-files | grep -i 'xArtists-master' || true

test ! -d xArtists-master && echo "no nested dir" || echo "REMOVE local dir"
```

If `git ls-files` still lists paths under `xArtists-master/`:

```bash
git rm -r --cached xArtists-master
git commit -m "chore: drop nested xArtists-master from index"
```

## Related clutter (optional follow-up)

- Root `dist/` — prefer CI artifacts only (`static.yml`)
- Multiple `DEPLOY_TRIGGER*.md` — can move under `archive/` later

## Status

**P1.2 closed** when:

1. `.gitignore` contains `xArtists-master/`
2. No tracked files under that path
3. This doc exists
