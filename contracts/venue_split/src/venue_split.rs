//! Venue Split SC — draft audit-ready (MultiversX).
//! IMMUTABLE post-deploy. Do NOT deploy before GO_LIVE checklist.
//!
//! Split (bps, sum = 10_000):
//!   institution 4000 | associations 2000 | lia 2500 | holders 1500
//!
//! No private keys in this crate. Owner optional for pause only.

#![no_std]

// Placeholder module layout for mx-sdk / multiversx-sc.
// Compile with official MultiversX SC toolchain when ready.

/// Basis points total
pub const BPS_TOTAL: u32 = 10_000;
pub const BPS_INSTITUTION: u32 = 4_000;
pub const BPS_ASSOCIATIONS: u32 = 2_000;
pub const BPS_LIA: u32 = 2_500;
pub const BPS_HOLDERS: u32 = 1_500;

const _: () = assert!(
    BPS_INSTITUTION + BPS_ASSOCIATIONS + BPS_LIA + BPS_HOLDERS == BPS_TOTAL
);

/// Pseudo-endpoints (documentés pour implémentation mx-sdk) :
///
/// init(institution, associations, lia, holders_rewards_pool)
///   - store 4 addresses
///   - assert non-zero / erd1
///
/// #[payable("EGLD")]
/// rent_pay(tier_id: ManagedBuffer)
///   - require payment > 0
///   - split egld by bps → direct_send each bucket
///   - emit RentPaid event
///
/// #[payable("*")]
/// rent_pay_esdt(tier_id: ManagedBuffer)
///   - single ESDT transfer (e.g. USDC)
///   - same bps split
///
/// #[view]
/// get_split_bps() -> MultiValue4<u32,...>
///
/// #[view]
/// get_buckets() -> addresses
///
/// Security notes:
/// - No set_split after init (immutable economics)
/// - No arbitrary withdraw by owner
/// - Optional pause: if enabled, only blocks new rent_pay (no sweep)

pub fn split_amount(amount: u64) -> (u64, u64, u64, u64) {
    let inst = amount * (BPS_INSTITUTION as u64) / (BPS_TOTAL as u64);
    let assoc = amount * (BPS_ASSOCIATIONS as u64) / (BPS_TOTAL as u64);
    let lia = amount * (BPS_LIA as u64) / (BPS_TOTAL as u64);
    // remainder to holders to absorb dust
    let holders = amount.saturating_sub(inst + assoc + lia);
    (inst, assoc, lia, holders)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn split_100_egld_atoms() {
        let (a, b, c, d) = split_amount(10_000);
        assert_eq!(a + b + c + d, 10_000);
        assert_eq!(a, 4_000);
        assert_eq!(b, 2_000);
        assert_eq!(c, 2_500);
        assert_eq!(d, 1_500);
    }
}
