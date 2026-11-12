# xRights — public workbench preview 0.6.0 (commerce OFF)

This repository package imports the former private prototype and adds a downloadable browser tool to xArtists.
Canonical page: https://xartists.art/create/world-rights/
Standalone: https://xartists.art/plugins/xa-world-rights/app.html
Public premium plugin download: **DISABLED**. The old unauthenticated ZIP has been removed from the source tree; commercial deliveries need server-side signed entitlements.

## Included and usable
- Browser-local dossier editor, original-file SHA-256 (up to 64 MiB), exact EUR quote/royalty arithmetic, JSON export/import with approval reset.
- Thirteen named networks and fifteen named formats, plus manual intake. This catalogue is NOT thirteen API integrations.
- Existing Python SQLite reservation/receipt prototype and tests under skills/social-rights.
- YouTube read-only HTTP integration under services/access-api/src/worldRightsHttp.mjs. It is OFF unless explicitly configured by the operator. No Google client is created by this package.
- **No publicly downloadable plugin ZIP.** The public browser demo is local dossier preparation only. A future commercial distribution must be private and gated by verified entitlements.

## Run locally
Open web/app.html for the local dossier tool. Browser SHA-256 availability depends on the secure context; use an HTTPS/local web server if needed. YouTube connection requires the server integration; never paste OAuth secrets into this page.
Python: install skills/social-rights/scripts/requirements.txt in your own environment, then run:
python -m unittest discover -s skills/social-rights/scripts -p 'test_*.py' -v

## Connection setup
Register a Google confidential web client with YouTube Data API, review OAuth consent and quota requirements, and configure only server-side:
WORLD_RIGHTS_YOUTUBE_ENABLED=0
WORLD_RIGHTS_GOOGLE_CLIENT_ID=
WORLD_RIGHTS_GOOGLE_CLIENT_SECRET=
WORLD_RIGHTS_GOOGLE_REDIRECT_URI=https://xartists-access-api.onrender.com/world-rights/youtube/callback

Only after the client, callback and test account are explicitly approved may the operator set the YouTube flag to 1. No such change is made by this source release.
The client requests youtube.readonly, online access and PKCE S256. Account state and tokens live only in the API process for at most one hour; no refresh token is stored. No commercial rights follow from account access.
The popup uses first-party secure HttpOnly cookies and origin/source-checked postMessage. Local disconnect is a CSRF-protected POST; it is not Google grant revocation and does not delete posts.
Session state is currently single-process/ephemeral. Restart loses connections. Multi-instance production needs a shared TTL/session store, secret-management review, abuse monitoring and real account integration tests.

## Verification and limitations
.github/workflows/xa-world-rights-ci.yml checks the imported Python tests, HTTP state/cookie boundaries with fake Google responses, absence of public premium download, frontend build and Chromium/Firefox/WebKit desktop/mobile layouts.
CI browser engines do not certify every browser version, branded browser or physical mobile device. Embedded social browsers and popup restrictions can require opening the tool in a regular browser.
A browser-local draft, a checked box, a Google connection, an unverified receipt candidate or a payment return never grants copyright or activates a sale. No public listing, bid, checkout, payment, mint, signature collection or real delivery is implemented.
Existing receipts schema v1.0.0 remains unchanged. The Python register is still a simulation, not the production global exclusivity database.
Older skill reference chapters describe prototype milestones 0.1–0.5; this README describes the repository/web integration. A saved source commit is not a successful deployment. Consult GitHub Actions and the deployed build-info.json for the actual source SHA.

The current software notice (LICENSE) reserves distribution rights subject to verified authorship. Prior legitimately MIT-licensed copies keep the grants made to them. Browser demo usage is distinct from future paid licensed plugin access. No payment, entitlement or verified owner-wallet exception is active. This does not register copyright or revoke prior MIT grants.

## Nom public et compatibilité

La marque de présentation est désormais **xRights**. Le nom technique `xartists-social-rights`, le chemin `packages/xa-world-rights` et l’URL embarquée `/plugins/xa-world-rights/` restent conservés pour compatibilité et historique des licences. Ce renommage ne change ni le propriétaire du droit d’auteur, ni les permissions existantes, ni les droits des anciens exemplaires sous MIT, ni les obligations d’autorisation des plateformes.

## Mise à jour d'intégration frontend (11 novembre 2026)

Page canonique [xRights](https://xartists.art/create/world-rights/) et [atelier autonome](https://xartists.art/plugins/xa-world-rights/app.html) sont des **outils de dossier et de préparation de licence**, non un logiciel commercial librement téléchargeable.

**Distribution premium : toujours fermée** jusqu'à l'implémentation de la licence payante / exemption du compte propriétaire par un entitlement **serveur** signé. Un ZIP anonyme ou un jeton d'admin dans le navigateur serait contraire à cette politique. Le connecteur YouTube, quand configuré, est lecture seule et ne prouve jamais les droits sur chaque publication.

Les collections privées Google Drive ne sont ni aspirées ni publiées par xRights. Le montage de dossiers ou de licences ne déclenche pas de mint, vente ou transfert.
