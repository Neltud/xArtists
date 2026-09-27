//! Rewards Pool SC — draft audit-ready (MultiversX).
//! Accrue holder share · claim by eligible stakers.
//! Do NOT deploy before GO_LIVE + audit.

#![no_std]

/// Pseudo-layout mx-sdk:
///
/// init(treasury_lia, artpass_token_id)
///   - store LIA residual address + ArtPass identifier
///
/// #[payable("*")]
/// fund()
///   - any ESDT/EGLD from allowed funders adds to pool_balance
///   - emit Funded
///
/// stake_artpass(nonce, amount) / unstake_artpass
///   - lock ArtPass SFT for eligibility boost
///
/// claim()
///   - compute weight = f(lp_snapshot_or_zero, artpass_staked)
///   - V1: pro-rata pending[user] (updated by off-chain keeper OR equal split demo)
///   - V2: on-chain LP proof when available
///   - send rewards · zero pending
///
/// Security:
/// - No owner sweep of user pending
/// - Optional pause blocks claim/fund
/// - No TRO mint

pub fn pro_rata(share_bps: u32, pool: u64) -> u64 {
    if share_bps == 0 || pool == 0 {
        return 0;
    }
    pool.saturating_mul(share_bps as u64) / 10_000
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn pro_rata_15_percent() {
        assert_eq!(pro_rata(1_500, 10_000), 1_500);
    }
}
