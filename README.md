# xArtists — LIA v5

**Version:** 0.5.0

## Versioning & Releases

This project uses **GitHub Releases** for versioning.

### How to create a new release:

1. Make sure all changes are on `main` and tests pass.
2. Bump version in `package.json` (or use `npm run release` with conventional commits).
3. Create a new GitHub Release:
   - Go to **Releases** → **Draft a new release**
   - Choose a tag (e.g. `v0.5.0`)
   - Write release notes (what's new, breaking changes, etc.)
   - Publish release

This will automatically trigger deployment to GitHub Pages.

### Recommended workflow:
- Use [Conventional Commits](https://www.conventionalcommits.org/)
- Use `standard-version` or GitHub's release UI
- Tag format: `vMAJOR.MINOR.PATCH`

Current deployed version is always available at: https://neltud.github.io/xArtists
