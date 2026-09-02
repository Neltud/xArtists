"""Official Burnify (burnify.app) mainnet constants + LIA policy knobs."""
from __future__ import annotations
from dataclasses import dataclass

BFY_TOKEN_ID = "BFY-8344ff"
BFY_DECIMALS = 18
TRO_TOKEN_ID = "TRO-94c925"
TRO_DECIMALS = 6
STAKING_SC = "erd1qqqqqqqqqqqqqpgqm2mkm02pam4tvtykfs7e8w508vzfvjqrp4ssfrts0f"
LIA_WALLET = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"
BATCH_EGLD_HALF = 0.015
BATCH_TOKEN_EGLD_EQUIV = 0.015
CYCLE_HOURS = 24
MAX_BATCHES_PER_USER = 10_000
STAKER_SHARE_BPS = 9000
TEAM_BPS = 500
BUFU_BPS = 500
EXPLORER_STAKING = f"https://explorer.multiversx.com/accounts/{STAKING_SC}"
APP_URL = "https://burnify.app"
LITEOBABER = "https://litepaper.burnify.app/overview/how-it-works"


@dataclass
class BurnifyConfig:
    claim_after_batches: int = 5
    claim_min_hours: float = 24.0
    max_batches_per_cycle: int = 3
    min_bfy_staked: float = 1.0
    min_tro_for_batch: float = 1.0
    min_egld_for_batch: float = 0.02
    egld_gas_reserve: float = 0.15
    tro_listed: bool = True
    require_live_flag: bool = True
    env_live_key: str = "LIA_BURNIFY_LIVE"
    paper_default: bool = True
    staking_sc: str = STAKING_SC
    bfy_token: str = BFY_TOKEN_ID
    tro_token: str = TRO_TOKEN_ID
    lia_wallet: str = LIA_WALLET


DEFAULT_CONFIG = BurnifyConfig()
