# XA World Rights — web pilot 0.6.0

This repository package imports the former private prototype and adds a downloadable browser tool to xArtists.
Canonical page: https://neltud.github.io/xArtists/create/world-rights/
Standalone: https://neltud.github.io/xArtists/plugins/xa-world-rights/app.html
Download: https://neltud.github.io/xArtists/plugins/xa-world-rights/xa-world-rights-0.6.0.zip

## Included and usable
- Browser-local dossier editor, original-file SHA-256 (up to 64 MiB), exact EUR quote/royalty arithmetic, JSON export/import with approval reset.
- Thirteen named networks and fifteen named formats, plus manual intake. This catalogue is NOT thirteen API integrations.
- Existing Python SQLite reservation/receipt prototype and tests under skills/social-rights.
- YouTube read-only HTTP integration under services/access-api/src/worldRightsHttp.mjs. It is OFF unless explicitly configured by the operator. No Google client is created by this package.
- Real source ZIP, including the browser tool and Python prototype. No executable browser extension is installed; no account password is requested.

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
.github/workflows/xa-world-rights-ci.yml checks the imported Python tests, HTTP state/cookie boundaries with fake Google responses, archive integrity, frontend build and Chromium/Firefox/WebKit desktop/mobile layouts.
CI browser engines do not certify every browser version, branded browser or physical mobile device. Embedded social browsers and popup restrictions can require opening the tool in a regular browser.
A browser-local draft, a checked box, a Google connection, an unverified receipt candidate or a payment return never grants copyright or activates a sale. No public listing, bid, checkout, payment, mint, signature collection or real delivery is implemented.
Existing receipts schema v1.0.0 remains unchanged. The Python register is still a simulation, not the production global exclusivity database.
Older skill reference chapters describe prototype milestones 0.1–0.5; this README describes the repository/web integration. A saved source commit is not a successful deployment. Consult GitHub Actions and the deployed build-info.json for the actual source SHA.

The included software follows the repository MIT license (LICENSE). This software license grants no rights to third-party social content.
