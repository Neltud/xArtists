#![no_std]

//! xArtists Slot Casino — MultiversX
//!
//! - Public spin in EGLD or whitelisted ESDT (e.g. USDC)
//! - Progressive pot: share of each bet
//! - Grand outcome pays entire progressive (+ optional bonus bps of bet)
//! - Table wins (line / diag / pair) paid from contract balance
//! - Owner: pause, config BPS, whitelist tokens, claim house surplus
//!
//! Randomness: block random seed (not VRF oracle). Fair-enough for casino UX;
//! document for users. Pause + owner controls for mainnet ops.

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

const BPS_DENOM: u64 = 10_000;

/// Max progressive contribution / house rake (safety)
const MAX_BPS: u16 = 5_000;

/// Outcome weights over 10_000 draws (tunable via storage later if needed)
/// Grand ~0.08%, line ~2%, diag ~2%, pair ~6%, rest lose
const OUTCOME_GRAND_MAX: u16 = 8;
const OUTCOME_LINE_MAX: u16 = 208;
const OUTCOME_DIAG_MAX: u16 = 408;
const OUTCOME_PAIR_MAX: u16 = 1_008;

/// Multipliers in BPS of bet (10000 = 1x)
const MULT_LINE_BPS: u32 = 80_000; // 8x
const MULT_DIAG_BPS: u32 = 70_000; // 7x
const MULT_PAIR_BPS: u32 = 12_000; // 1.2x

#[derive(TopEncode, TopDecode, TypeAbi, PartialEq, Eq, Clone, Copy)]
pub enum SpinOutcome {
    Lose,
    Pair,
    Diagonal,
    Line3,
    Grand,
}

#[multiversx_sc::contract]
pub trait SlotCasino {
    /// progressive_contrib_bps: share of each bet → pot (e.g. 2500 = 25%)
    /// house_rake_bps: share of *table* win retained by house (e.g. 1500 = 15%)
    /// min_bet: minimum EGLD/ESDT amount (raw units)
    #[init]
    fn init(&self, progressive_contrib_bps: u16, house_rake_bps: u16, min_bet: BigUint) {
        require!(progressive_contrib_bps <= MAX_BPS, "progressive bps too high");
        require!(house_rake_bps <= MAX_BPS, "rake bps too high");
        require!(min_bet > 0, "min bet zero");

        let caller = self.blockchain().get_caller();
        self.owner().set(&caller);
        self.pending_owner().clear();
        self.paused().set(false);

        self.progressive_contrib_bps().set(progressive_contrib_bps);
        self.house_rake_bps().set(house_rake_bps);
        self.min_bet().set(&min_bet);

        self.progressive_egld().set(BigUint::zero());
        self.spin_count().set(0u64);
        self.total_wagered_egld().set(BigUint::zero());
        self.total_paid_egld().set(BigUint::zero());
        self.grand_count().set(0u64);
    }

    #[endpoint(upgrade)]
    fn upgrade(&self) {
        self.require_owner();
    }

    // ─── Admin ───────────────────────────────────────────────

    fn require_owner(&self) {
        require!(
            self.blockchain().get_caller() == self.owner().get(),
            "only owner"
        );
    }

    fn require_not_paused(&self) {
        require!(!self.paused().get(), "paused");
    }

    #[endpoint(setPaused)]
    fn set_paused(&self, value: bool) {
        self.require_owner();
        self.paused().set(value);
    }

    #[endpoint(setProgressiveContribBps)]
    fn set_progressive_contrib_bps(&self, bps: u16) {
        self.require_owner();
        require!(bps <= MAX_BPS, "bps too high");
        self.progressive_contrib_bps().set(bps);
    }

    #[endpoint(setHouseRakeBps)]
    fn set_house_rake_bps(&self, bps: u16) {
        self.require_owner();
        require!(bps <= MAX_BPS, "bps too high");
        self.house_rake_bps().set(bps);
    }

    #[endpoint(setMinBet)]
    fn set_min_bet(&self, min_bet: BigUint) {
        self.require_owner();
        require!(min_bet > 0, "min bet zero");
        self.min_bet().set(&min_bet);
    }

    /// Whitelist ESDT for spins (e.g. USDC). EGLD always allowed via spinEgld.
    #[endpoint(setPaymentTokenAllowed)]
    fn set_payment_token_allowed(&self, token: TokenIdentifier, allowed: bool) {
        self.require_owner();
        self.payment_token_allowed(&token).set(allowed);
    }

    /// Seed or top-up progressive pot (EGLD).
    #[payable("EGLD")]
    #[endpoint(fundProgressiveEgld)]
    fn fund_progressive_egld(&self) {
        self.require_owner();
        let payment = self.call_value().egld_value().clone_value();
        require!(payment > 0, "zero payment");
        self.progressive_egld()
            .update(|p| *p += &payment);
        self.fund_progressive_event(&payment);
    }

    #[endpoint(transferOwnership)]
    fn transfer_ownership(&self, new_owner: ManagedAddress) {
        self.require_owner();
        require!(!new_owner.is_zero(), "zero address");
        require!(new_owner != self.owner().get(), "same owner");
        self.pending_owner().set(&new_owner);
    }

    #[endpoint(acceptOwnership)]
    fn accept_ownership(&self) {
        let caller = self.blockchain().get_caller();
        require!(!self.pending_owner().is_empty(), "no pending owner");
        require!(caller == self.pending_owner().get(), "not pending owner");
        self.owner().set(&caller);
        self.pending_owner().clear();
    }

    /// Withdraw house surplus: balance − progressive − locked reserve (0).
    /// Never drains the progressive pot.
    #[endpoint(claimHouseEgld)]
    fn claim_house_egld(&self) {
        self.require_owner();
        let progressive = self.progressive_egld().get();
        let balance = self.blockchain().get_sc_balance(&EgldOrEsdtTokenIdentifier::egld(), 0);
        require!(balance > progressive, "nothing claimable");
        let claimable = balance - &progressive;
        let owner = self.owner().get();
        self.send().direct_egld(&owner, &claimable);
        self.claim_house_event(&owner, &claimable);
    }

    // ─── Play: EGLD ──────────────────────────────────────────

    #[payable("EGLD")]
    #[endpoint(spinEgld)]
    fn spin_egld(&self) {
        self.require_not_paused();
        let caller = self.blockchain().get_caller();
        let bet = self.call_value().egld_value().clone_value();
        let min_bet = self.min_bet().get();
        require!(bet >= min_bet, "bet below minimum");

        self.execute_spin_egld(&caller, &bet);
    }

    fn execute_spin_egld(&self, player: &ManagedAddress, bet: &BigUint) {
        // Progressive contribution
        let contrib_bps = self.progressive_contrib_bps().get() as u64;
        let to_progressive = bet * contrib_bps / BPS_DENOM;
        self.progressive_egld()
            .update(|p| *p += &to_progressive);

        self.total_wagered_egld()
            .update(|t| *t += bet);
        let spin_id = self.spin_count().update(|c| {
            *c += 1;
            *c
        });

        let roll = self.roll_u16();
        let outcome = self.outcome_from_roll(roll);

        let mut payout = BigUint::zero();
        let mut progressive_paid = BigUint::zero();

        match outcome {
            SpinOutcome::Grand => {
                let pot = self.progressive_egld().get();
                // Entire progressive + small bonus 5% of bet
                let bonus = bet * 500u64 / BPS_DENOM;
                payout = &pot + &bonus;
                progressive_paid = pot;
                self.progressive_egld().set(BigUint::zero());
                self.grand_count().update(|g| *g += 1);
            }
            SpinOutcome::Line3 => {
                payout = self.table_payout(bet, MULT_LINE_BPS);
            }
            SpinOutcome::Diagonal => {
                payout = self.table_payout(bet, MULT_DIAG_BPS);
            }
            SpinOutcome::Pair => {
                payout = self.table_payout(bet, MULT_PAIR_BPS);
            }
            SpinOutcome::Lose => {
                payout = BigUint::zero();
            }
        }

        if payout > 0 {
            // Solvency: cannot pay more than balance
            let balance = self.blockchain().get_sc_balance(&EgldOrEsdtTokenIdentifier::egld(), 0);
            if payout > balance {
                payout = balance;
            }
            // After grand, progressive already zero; for table wins keep progressive reserved
            if outcome != SpinOutcome::Grand {
                let progressive = self.progressive_egld().get();
                let max_pay = if balance > progressive {
                    balance - &progressive
                } else {
                    BigUint::zero()
                };
                if payout > max_pay {
                    payout = max_pay;
                }
            }
            if payout > 0 {
                self.send().direct_egld(player, &payout);
                self.total_paid_egld().update(|t| *t += &payout);
            }
        }

        self.spin_event(
            spin_id,
            player,
            bet,
            &payout,
            &to_progressive,
            &progressive_paid,
            outcome,
            roll,
        );
    }

    /// Table win after house rake: mult_bps of bet, then user keeps (10000 - rake)/10000
    fn table_payout(&self, bet: &BigUint, mult_bps: u32) -> BigUint {
        let gross = bet * (mult_bps as u64) / BPS_DENOM;
        let rake_bps = self.house_rake_bps().get() as u64;
        let user_bps = BPS_DENOM - rake_bps;
        gross * user_bps / BPS_DENOM
    }

    // ─── Play: ESDT (USDC etc.) ──────────────────────────────

    #[payable("*")]
    #[endpoint(spinEsdt)]
    fn spin_esdt(&self) {
        self.require_not_paused();
        let caller = self.blockchain().get_caller();
        let payment = self.call_value().single_esdt();
        require!(payment.token_nonce == 0, "only fungible");
        require!(
            self.payment_token_allowed(&payment.token_identifier).get(),
            "token not allowed"
        );
        let bet = payment.amount;
        let min_bet = self.min_bet().get();
        require!(bet >= min_bet, "bet below minimum");

        self.execute_spin_esdt(&caller, &payment.token_identifier, &bet);
    }

    fn execute_spin_esdt(&self, player: &ManagedAddress, token: &TokenIdentifier, bet: &BigUint) {
        let contrib_bps = self.progressive_contrib_bps().get() as u64;
        let to_progressive = bet * contrib_bps / BPS_DENOM;

        self.progressive_esdt(token)
            .update(|p| *p += &to_progressive);

        self.total_wagered_esdt(token)
            .update(|t| *t += bet);
        let spin_id = self.spin_count().update(|c| {
            *c += 1;
            *c
        });

        let roll = self.roll_u16();
        let outcome = self.outcome_from_roll(roll);

        let mut payout = BigUint::zero();
        let mut progressive_paid = BigUint::zero();

        match outcome {
            SpinOutcome::Grand => {
                let pot = self.progressive_esdt(token).get();
                let bonus = bet * 500u64 / BPS_DENOM;
                payout = &pot + &bonus;
                progressive_paid = pot;
                self.progressive_esdt(token).set(BigUint::zero());
                self.grand_count().update(|g| *g += 1);
            }
            SpinOutcome::Line3 => {
                payout = self.table_payout(bet, MULT_LINE_BPS);
            }
            SpinOutcome::Diagonal => {
                payout = self.table_payout(bet, MULT_DIAG_BPS);
            }
            SpinOutcome::Pair => {
                payout = self.table_payout(bet, MULT_PAIR_BPS);
            }
            SpinOutcome::Lose => {}
        }

        if payout > 0 {
            let token_id = EgldOrEsdtTokenIdentifier::esdt(token.clone());
            let balance = self.blockchain().get_sc_balance(&token_id, 0);
            if payout > balance {
                payout = balance.clone();
            }
            if outcome != SpinOutcome::Grand {
                let progressive = self.progressive_esdt(token).get();
                let max_pay = if balance > progressive {
                    balance - &progressive
                } else {
                    BigUint::zero()
                };
                if payout > max_pay {
                    payout = max_pay;
                }
            }
            if payout > 0 {
                self.send()
                    .direct_esdt(player, token, 0, &payout);
                self.total_paid_esdt(token).update(|t| *t += &payout);
            }
        }

        self.spin_esdt_event(
            spin_id,
            player,
            token,
            bet,
            &payout,
            &to_progressive,
            &progressive_paid,
            outcome,
            roll,
        );
    }

    #[endpoint(claimHouseEsdt)]
    fn claim_house_esdt(&self, token: TokenIdentifier) {
        self.require_owner();
        let progressive = self.progressive_esdt(&token).get();
        let token_id = EgldOrEsdtTokenIdentifier::esdt(token.clone());
        let balance = self.blockchain().get_sc_balance(&token_id, 0);
        require!(balance > progressive, "nothing claimable");
        let claimable = balance - &progressive;
        let owner = self.owner().get();
        self.send()
            .direct_esdt(&owner, &token, 0, &claimable);
        self.claim_house_esdt_event(&owner, &token, &claimable);
    }

    #[payable("*")]
    #[endpoint(fundProgressiveEsdt)]
    fn fund_progressive_esdt(&self) {
        self.require_owner();
        let payment = self.call_value().single_esdt();
        require!(payment.token_nonce == 0, "only fungible");
        require!(payment.amount > 0, "zero payment");
        self.progressive_esdt(&payment.token_identifier)
            .update(|p| *p += &payment.amount);
    }

    // ─── RNG ─────────────────────────────────────────────────

    fn roll_u16(&self) -> u16 {
        let seed = self.blockchain().get_block_random_seed();
        // Mix first 4 bytes into u32 then mod 10000
        let b0 = seed.get(0) as u32;
        let b1 = seed.get(1) as u32;
        let b2 = seed.get(2) as u32;
        let b3 = seed.get(3) as u32;
        let tx = self.blockchain().get_tx_hash();
        let t0 = tx.get(0) as u32;
        let mixed = b0
            .wrapping_mul(1_009)
            .wrapping_add(b1.wrapping_mul(73))
            .wrapping_add(b2.wrapping_mul(17))
            .wrapping_add(b3)
            .wrapping_add(t0.wrapping_mul(31))
            .wrapping_add(self.spin_count().get() as u32);
        (mixed % 10_000) as u16
    }

    fn outcome_from_roll(&self, roll: u16) -> SpinOutcome {
        if roll < OUTCOME_GRAND_MAX {
            SpinOutcome::Grand
        } else if roll < OUTCOME_LINE_MAX {
            SpinOutcome::Line3
        } else if roll < OUTCOME_DIAG_MAX {
            SpinOutcome::Diagonal
        } else if roll < OUTCOME_PAIR_MAX {
            SpinOutcome::Pair
        } else {
            SpinOutcome::Lose
        }
    }

    // ─── Views ───────────────────────────────────────────────

    #[view(getProgressiveEgld)]
    #[storage_mapper("progressive_egld")]
    fn progressive_egld(&self) -> SingleValueMapper<BigUint>;

    #[view(getProgressiveEsdt)]
    #[storage_mapper("progressive_esdt")]
    fn progressive_esdt(&self, token: &TokenIdentifier) -> SingleValueMapper<BigUint>;

    #[view(getSpinCount)]
    #[storage_mapper("spin_count")]
    fn spin_count(&self) -> SingleValueMapper<u64>;

    #[view(getGrandCount)]
    #[storage_mapper("grand_count")]
    fn grand_count(&self) -> SingleValueMapper<u64>;

    #[view(getMinBet)]
    #[storage_mapper("min_bet")]
    fn min_bet(&self) -> SingleValueMapper<BigUint>;

    #[view(getProgressiveContribBps)]
    #[storage_mapper("progressive_contrib_bps")]
    fn progressive_contrib_bps(&self) -> SingleValueMapper<u16>;

    #[view(getHouseRakeBps)]
    #[storage_mapper("house_rake_bps")]
    fn house_rake_bps(&self) -> SingleValueMapper<u16>;

    #[view(isPaused)]
    #[storage_mapper("paused")]
    fn paused(&self) -> SingleValueMapper<bool>;

    #[view(getOwner)]
    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[view(isPaymentTokenAllowed)]
    #[storage_mapper("payment_token_allowed")]
    fn payment_token_allowed(&self, token: &TokenIdentifier) -> SingleValueMapper<bool>;

    #[storage_mapper("pending_owner")]
    fn pending_owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("total_wagered_egld")]
    fn total_wagered_egld(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("total_paid_egld")]
    fn total_paid_egld(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("total_wagered_esdt")]
    fn total_wagered_esdt(&self, token: &TokenIdentifier) -> SingleValueMapper<BigUint>;

    #[storage_mapper("total_paid_esdt")]
    fn total_paid_esdt(&self, token: &TokenIdentifier) -> SingleValueMapper<BigUint>;

    // ─── Events ──────────────────────────────────────────────

    #[event("spin")]
    fn spin_event(
        &self,
        #[indexed] spin_id: u64,
        #[indexed] player: &ManagedAddress,
        bet: &BigUint,
        payout: &BigUint,
        to_progressive: &BigUint,
        progressive_paid: &BigUint,
        outcome: SpinOutcome,
        roll: u16,
    );

    #[event("spinEsdt")]
    fn spin_esdt_event(
        &self,
        #[indexed] spin_id: u64,
        #[indexed] player: &ManagedAddress,
        #[indexed] token: &TokenIdentifier,
        bet: &BigUint,
        payout: &BigUint,
        to_progressive: &BigUint,
        progressive_paid: &BigUint,
        outcome: SpinOutcome,
        roll: u16,
    );

    #[event("fundProgressive")]
    fn fund_progressive_event(&self, amount: &BigUint);

    #[event("claimHouse")]
    fn claim_house_event(&self, #[indexed] to: &ManagedAddress, amount: &BigUint);

    #[event("claimHouseEsdt")]
    fn claim_house_esdt_event(
        &self,
        #[indexed] to: &ManagedAddress,
        #[indexed] token: &TokenIdentifier,
        amount: &BigUint,
    );
}
