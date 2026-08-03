# mxpy — issue collection NFT + mint (mainnet)

> **PEM uniquement hors navigateur** (machine ops / Vellum isolé). Chain `1` = mainnet.

Remplacer :
- `wallet.pem`
- `COLLECTION_TICKER` (3–10 A-Z0-9)
- `COLLECTION_NAME`
- URIs IPFS après pin Pinata

## 0. Config

```bash
export PROXY=https://gateway.multiversx.com
export CHAIN=1
# mxpy config set proxy $PROXY
# mxpy config set chainID $CHAIN
```

## 1. Issue NFT collection (ESDTsystem SC)

Frais d’émission réseau ≈ **0.05 EGLD** (+ gas).

```bash
mxpy tx new --proxy https://gateway.multiversx.com --chain 1 \
  --pem wallet.pem --recall-nonce \
  --receiver erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u \
  --value 50000000000000000 \
  --gas-limit 60000000 \
  --data "issueNonFungible@$(echo -n 'MyCollection' | xxd -p | tr -d '\n')@$(echo -n 'MYCOL' | xxd -p | tr -d '\n')@63616e467265657a65@74727565@63616e57697065@74727565@63616e4368616e67654f776e6572@74727565@63616e4164645370656369616c526f6c6573@74727565" \
  --send
```

Décodage data (human) :

```text
issueNonFungible
  @name_hex
  @ticker_hex
  @canFreeze@true @canWipe@true @canChangeOwner@true @canAddSpecialRoles@true
```

Après succès : noter le **token identifier** `TICKER-xxxxxx` sur l’explorer.

### Rôles minter (souvent requis)

```bash
# setSpecialRole pour ESDTRoleNFTCreate sur VOTRE adresse
# (voir docs MultiversX ESDT roles — adapter data hex)
mxpy tx new --proxy https://gateway.multiversx.com --chain 1 \
  --pem wallet.pem --recall-nonce \
  --receiver erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u \
  --gas-limit 60000000 \
  --data "setSpecialRole@TOKEN_ID_HEX@ADDRESS_HEX@ESDTRoleNFTCreate" \
  --send
```

Utiliser `mxpy wallet bech32` / convertisseurs hex officiels pour `TOKEN_ID_HEX` et `ADDRESS_HEX`.

## 2. Créer (mint) un NFT

```bash
# NAME, ROYALTIES (ex 500 = 5%), HASH, ATTRIBUTES, URI(s)
mxpy tx new --proxy https://gateway.multiversx.com --chain 1 \
  --pem wallet.pem --recall-nonce \
  --receiver erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqzllls8a5w6u \
  --gas-limit 20000000 \
  --data "ESDTNFTCreate@TOKEN_ID_HEX@01@NAME_HEX@01f4@HASH_HEX@ATTR_HEX@URI_HEX" \
  --send
```

Champs `ESDTNFTCreate` (ordre protocol) :

1. token identifier
2. quantity (`01` = 1)
3. name
4. royalties (u64, 1000 = 10%)
5. hash (peut être `00` ou hash fichier)
6. attributes
7. one or more URIs (metadata JSON `ipfs://…` et/ou media)

### Helper Python (génère le data string)

```bash
python -m lia.media.mxpy_nft_data \
  --token TRO-94c925 \
  --name "Clip 01" \
  --royalties 500 \
  --uri "ipfs://QmMetadataCID"
```

## 3. Estimation gaz

```bash
mxpy tx new ... --gas-limit 20000000   # ajuster après
# Idéal : simuler via gateway /transaction/cost avant --send
python -m lia.gas.mvx_gas
```

## 4. Lister sur marketplace xArtists

Après mint, utiliser la dApp **Sell / List** ou tx `ESDTNFTTransfer` → SC marketplace + `listNft` (voir `useMarketplaceTx`).
