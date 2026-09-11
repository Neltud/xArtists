# Branche `feat/sdk-dapp-v5`

**But :** migrer vers `@multiversx/sdk-dapp` **v5.7+** + `sdk-core` **16.x** avant TX live.

Mainnet lecture OK · fonds OFF jusqu’à SC verify + DEMO off.

## Steps

```bash
git checkout feat/sdk-dapp-v5
cd apps/frontend
npm install @multiversx/sdk-dapp@^5.7 @multiversx/sdk-core@^16 --legacy-peer-deps
# rewrite providers per MultiversX docs
npm run build
```

Merge only after CI green. Do not flip DEMO_MODE on this branch alone.

See also: `docs/VELLUM_NEXT_IMPROVEMENTS.md` on main.
