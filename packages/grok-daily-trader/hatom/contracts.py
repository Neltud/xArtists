"""Hatom Protocol — MultiversX mainnet addresses (docs.hatom.com networks)."""

CONTROLLER = "erd1qqqqqqqqqqqqqpgqxp28qpnv7rfcmk6qrgxgw5uf2fnp84ar78ssqdk6hr"

MARKETS = {
    "EGLD": {
        "market": "erd1qqqqqqqqqqqqqpgq35qkf34a8svu4r2zmfzuztmeltqclapv78ss5jleq3",
        "htoken": "HEGLD-d61095",
        "underlying": "EGLD",
    },
    "HTM": {
        "market": "erd1qqqqqqqqqqqqqpgqxerzmkr80xc0qwa8vvm5ug9h8e2y7jgsqk2svevje0",
        "htoken": "HHTM-e03ba5",
        "underlying": "HTM-f51d55",
    },
    "USDC": {
        "market": "erd1qqqqqqqqqqqqqpgqkrgsvct7hfx7ru30mfzk3uy6pxzxn6jj78ss84aldu",
        "htoken": "HUSDC-d80042",
        "underlying": "USDC-c76f1f",
    },
    "USDT": {
        "market": "erd1qqqqqqqqqqqqqpgqvxn0cl35r74tlw2a8d794v795jrzfxyf78sstg8pjr",
        "htoken": "HUSDT-6f0914",
        "underlying": "USDT-f8c08c",
    },
    "WBTC": {
        "market": "erd1qqqqqqqqqqqqqpgqg47t8v5nwzvdxgf6g5jkxleuplu8y4f678ssfcg5gy",
        "htoken": "HWBTC-49ca31",
        "underlying": "WBTC-49ca31",
    },
}

# Observed from mainnet success txs (verify before use)
BOOST_SC = "erd1qqqqqqqqqqqqqpgq8h6stfhdtkr0wwqstz28"  # partial — resolve full before live stake

# Endpoint patterns (payable ESDT unless noted)
# Supply:  ESDTTransfer@TOKEN@AMOUNT@mint  → market
# Redeem:  ESDTTransfer@HTOKEN@AMOUNT@redeem → market  OR redeemUnderlying
# Repay:   ESDTTransfer@TOKEN@AMOUNT@repayBorrow → market
# Borrow:  borrow@AMOUNT (no payment) → market (requires collateral + enterMarkets)
# Collateral: enterMarkets@marketAddress → controller
"""
