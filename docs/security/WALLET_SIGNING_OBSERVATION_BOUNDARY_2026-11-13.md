# xArtists Wallet: URL/localStorage ≠ signing session (13 November 2026)

**Guarded, financial NO-GO.** This is a frontend state trust-boundary fix, not a successful Reown/xPortal pairing proof.

## Risk fixed

Previously `WalletContext` treated `?address=erd1…` / `loginAddress` / hash-derived address as a `web_wallet` session with `sessionLive=true`, and restored `defi_wallet`/`web_wallet`/`wallet_connect` from browser `localStorage` as signing-capable without revalidating the provider. This could mislead UI components that gate `canAttemptSign` and downstream flows. A real signer still requires a separate provider approval, but an address string is not a session proof.

## New behavior

- Every URL-sourced erd1 address and every formerly stored non-xPortal address is normalized to `paste_readonly` + `sessionLive=false`.
- Ops wallet is rejected even as read-only. Untrusted callback address/query parameters are cleaned.
- xPortal may report signing eligibility **only** when the live pairing session exists and its address equals the currently selected account. A different WC session cannot lend signing status to a spoofed address.
- Fresh DeFi extension flow may still become UI-sign eligible by explicitly invoking the extension provider; the chain provider must separately obtain the user's voluntary transaction signature.
- Legacy `web_wallet`, `wallet_connect` and `pem` paths are not assumed signable from address input.
- Real Reown allowlist, browser QR pairing and voluntary approval in [#506](https://github.com/Neltud/xArtists/issues/506) remain unverified, unchanged.
- No signing, broadcast, checkout, mint or trade toggle is enabled. No xArtists email session is made equivalent to wallet ownership.

Unit tests directly execute the pure trust policy for URL observations, persisted spoofed sessions and mismatched xPortal addresses. The route `/workspace/wallet`, historical wallet-read-only accounts, marketplace and Studio remain navigable. 

Reference: MultiversX signing provider documentation explicitly describes an address returned by trivial Web Wallet login as an unauthenticated hint, and recommends native authentication for identity claims:
https://docs.multiversx.com/sdk-and-tools/sdk-js/sdk-js-signing-providers/
