#![no_std]

//! xArtists Slot Casino — MultiversX (Provably Fair)
//!
//! ## Provably fair flow
//! 1. `lockSpinEgld` / `lockSpinEsdt(client_seed)` — bet escrowed, seed committed
//! 2. Wait `resolve_delay_blocks` (≥1)
//! 3. `resolveSpin(spin_id)` — anyone; roll = keccak256(entropy) % 10000
//! 4. Events emit all inputs so anyone can recompute the roll
//!
//! Entropy =
//!   client_seed || spin_id_be8 || lock_block_be8 || resolve_block_be8 || block_random_seed
//!
//! Progressive + payouts applied only on resolve.
//! Timeout → full refund (no progressive taken).

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

const BPS_DENOM: u64 = 10_000;
const MAX_BPS: u16 = 5_000;
const MAX_CLIENT_SEED_LEN: usize = 64;
const MAX_PENDING_PER_USER: u32 = 5;
const DEFAULT_RESOLVE_DELAY: u64 = 2;
const DEFAULT_TIMEOUT_BLOCKS: u64 = 100;

const OUTCOME_GRAND_MAX: u16 = 8;
const OUTCOME_LINE_MAX: u16 = 208;
const OUTCOME_DIAG_MAX: u16 = 408;
const OUTCOME_PAIR_MAX: u16 = 1_008;

const MULT_LINE_BPS: u32 = 80_000;
const MULT_DIAG_BPS: u32 = 70_000;
const MULT_PAIR_BPS: u32 = 12_000;

#[derive(TopEncode, TopDecode, TypeAbi, NestedEncode, NestedDecode, PartialEq, Eq, Clone, Copy)]
pub enum SpinOutcome {
    Lose,
    Pair,
    Diagonal,
    Line3,
    Grand,
}

#[derive(TopEncode, TopDecode, TypeAbi, NestedEncode, NestedDecode, Clone)]
pub struct PendingSpin<M: ManagedTypeApi> {
    pub player: ManagedAddress<M>,
    pub is_egld: bool,
    pub token: TokenIdentifier<M>,
    pub bet: BigUint<M>,
    pub client_seed: ManagedBuffer<M>,
    pub lock_block: u64,
    pub resolve_after: u64,
    pub timeout_block: u64,
}

#[multiversx_sc::contract]
pub trait SlotCasino {
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
        self.resolve_delay_blocks().set(DEFAULT_RESOLVE_DELAY);
        self.timeout_blocks().set(DEFAULT_TIMEOUT_BLOCKS);

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

    #[endpoint(setResolveDelayBlocks)]
    fn set_resolve_delay_blocks(&self, delay: u64) {
        self.require_owner();
        require!(delay >= 1 && delay <= 20, "delay out of range");
        self.resolve_delay_blocks().set(delay);
    }

    #[endpoint(setTimeoutBlocks)]
    fn set_timeout_blocks(&self, blocks: u64) {
        self.require_owner();
        require!(blocks >= 10 && blocks <= 10_000, "timeout out of range");
        self.timeout_blocks().set(blocks);
    }

    #[endpoint(setPaymentTokenAllowed)]
    fn set_payment_token_allowed(&self, token: TokenIdentifier, allowed: bool) {
        self.require_owner();
        self.payment_token_allowed(&token).set(allowed);
    }

    #[payable("EGLD")]
    #[endpoint(fundProgressiveEgld)]
    fn fund_progressive_egld(&self) {
        self.require_owner();
        let payment = self.call_value().egld_value().clone_value();
        require!(payment > 0, "zero payment");
        self.progressive_egld().update(|p| *p += &payment);
        self.fund_progressive_event(&payment);
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

    #[endpoint(claimHouseEgld)]
    fn claim_house_egld(&self) {
        self.require_owner();
        let progressive = self.progressive_egld().get();
        let balance = self
            .blockchain()
            .get_sc_balance(&EgldOrEsdtTokenIdentifier::egld(), 0);
        require!(balance > progressive, "nothing claimable");
        let claimable = balance - &progressive;
        let owner = self.owner().get();
        self.send().direct_egld(&owner, &claimable);
        self.claim_house_event(&owner, &claimable);
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
        self.send().direct_esdt(&owner, &token, 0, &claimable);
        self.claim_house_esdt_event(&owner, &token, &claimable);
    }

    // ─── Lock (commit client seed + escrow) ──────────────────

    #[payable("EGLD")]
    #[endpoint(lockSpinEgld)]
    fn lock_spin_egld(&self, client_seed: ManagedBuffer) {
        self.require_not_paused();
        self.require_valid_client_seed(&client_seed);
        let caller = self.blockchain().get_caller();
        let bet = self.call_value().egld_value().clone_value();
        require!(bet >= self.min_bet().get(), "bet below minimum");
        self.require_under_pending_cap(&caller);

        let spin_id = self.next_spin_id();
        let lock_block = self.blockchain().get_block_nonce();
        let delay = self.resolve_delay_blocks().get();
        let timeout = self.timeout_blocks().get();

        let pending = PendingSpin {
            player: caller.clone(),
            is_egld: true,
            token: TokenIdentifier::from("EGLD"),
            bet: bet.clone(),
            client_seed: client_seed.clone(),
            lock_block,
            resolve_after: lock_block + delay,
            timeout_block: lock_block + timeout,
        };
        self.pending_spin(spin_id).set(&pending);
        self.user_pending_count(&caller)
            .update(|c| *c += 1);

        self.spin_locked_event(spin_id, &caller, &bet, &client_seed, lock_block, true);
    }

    #[payable("*")]
    #[endpoint(lockSpinEsdt)]
    fn lock_spin_esdt(&self, client_seed: ManagedBuffer) {
        self.require_not_paused();
        self.require_valid_client_seed(&client_seed);
        let caller = self.blockchain().get_caller();
        let payment = self.call_value().single_esdt();
        require!(payment.token_nonce == 0, "only fungible");
        require!(
            self.payment_token_allowed(&payment.token_identifier).get(),
            "token not allowed"
        );
        require!(payment.amount >= self.min_bet().get(), "bet below minimum");
        self.require_under_pending_cap(&caller);

        let spin_id = self.next_spin_id();
        let lock_block = self.blockchain().get_block_nonce();
        let delay = self.resolve_delay_blocks().get();
        let timeout = self.timeout_blocks().get();

        let pending = PendingSpin {
            player: caller.clone(),
            is_egld: false,
            token: payment.token_identifier.clone(),
            bet: payment.amount.clone(),
            client_seed: client_seed.clone(),
            lock_block,
            resolve_after: lock_block + delay,
            timeout_block: lock_block + timeout,
        };
        self.pending_spin(spin_id).set(&pending);
        self.user_pending_count(&caller)
            .update(|c| *c += 1);

        self.spin_locked_esdt_event(
            spin_id,
            &caller,
            &payment.token_identifier,
            &payment.amount,
            &client_seed,
            lock_block,
        );
    }

    fn require_valid_client_seed(&self, seed: &ManagedBuffer) {
        let len = seed.len();
        require!(len > 0 && len <= MAX_CLIENT_SEED_LEN, "invalid client seed length");
    }

    fn require_under_pending_cap(&self, user: &ManagedAddress) {
        let n = self.user_pending_count(user).get();
        require!(n < MAX_PENDING_PER_USER, "too many pending spins");
    }

    fn next_spin_id(&self) -> u64 {
        self.spin_count().update(|c| {
            *c += 1;
            *c
        })
    }

    // ─── Resolve (provably fair) ─────────────────────────────

    /// Anyone may resolve after delay — prevents players shopping for blocks.
    #[endpoint(resolveSpin)]
    fn resolve_spin(&self, spin_id: u64) {
        self.require_not_paused();
        require!(!self.pending_spin(spin_id).is_empty(), "unknown spin");
        let pending = self.pending_spin(spin_id).get();
        let block = self.blockchain().get_block_nonce();
        require!(block >= pending.resolve_after, "too early");
        require!(block <= pending.timeout_block, "timed out — use refundSpin");

        // Effects: clear pending first (CEI)
        self.pending_spin(spin_id).clear();
        self.user_pending_count(&pending.player).update(|c| {
            if *c > 0 {
                *c -= 1;
            }
        });

        let (roll, entropy_hash) = self.compute_roll(&pending, block);
        let outcome = self.outcome_from_roll(roll);

        if pending.is_egld {
            self.settle_egld(spin_id, &pending, outcome, roll, &entropy_hash, block);
        } else {
            self.settle_esdt(spin_id, &pending, outcome, roll, &entropy_hash, block);
        }
    }

    /// Full refund after timeout (no progressive, no roll).
    #[endpoint(refundSpin)]
    fn refund_spin(&self, spin_id: u64) {
        require!(!self.pending_spin(spin_id).is_empty(), "unknown spin");
        let pending = self.pending_spin(spin_id).get();
        let block = self.blockchain().get_block_nonce();
        require!(block > pending.timeout_block, "not timed out");

        self.pending_spin(spin_id).clear();
        self.user_pending_count(&pending.player).update(|c| {
            if *c > 0 {
                *c -= 1;
            }
        });

        if pending.is_egld {
            self.send().direct_egld(&pending.player, &pending.bet);
        } else {
            self.send()
                .direct_esdt(&pending.player, &pending.token, 0, &pending.bet);
        }
        self.spin_refund_event(spin_id, &pending.player, &pending.bet);
    }

    fn compute_roll(&self, pending: &PendingSpin<Self::Api>, resolve_block: u64) -> (u16, ManagedByteArray<Self::Api, 32>) {
        let mut buf = ManagedBuffer::new();
        buf.append(&pending.client_seed);
        buf.append(&self.u64_to_be_buf(pending.lock_block));
        buf.append(&self.u64_to_be_buf(resolve_block));
        buf.append(&self.u64_to_be_buf(self.spin_count().get())); // global entropy

        // Block random seed (48 bytes) — consensus entropy at resolve time
        let seed = self.blockchain().get_block_random_seed();
        buf.append_bytes(seed.as_managed_buffer().to_boxed_bytes().as_slice());

        // Player address bytes
        buf.append(pending.player.as_managed_buffer());

        let hash = self.crypto().keccak256(&buf);
        let roll = self.hash_to_roll(&hash);
        (roll, hash)
    }

    fn u64_to_be_buf(&self, v: u64) -> ManagedBuffer {
        let bytes = v.to_be_bytes();
        ManagedBuffer::new_from_bytes(&bytes)
    }

    fn hash_to_roll(&self, hash: &ManagedByteArray<Self::Api, 32>) -> u16 {
        // First 8 bytes → u64 BE → % 10000
        let mb = hash.as_managed_buffer();
        let mut bytes = [0u8; 8];
        let _ = mb.load_slice(0, &mut bytes);
        let n = u64::from_be_bytes(bytes);
        (n % 10_000) as u16
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

    fn table_payout(&self, bet: &BigUint, mult_bps: u32) -> BigUint {
        let gross = bet * (mult_bps as u64) / BPS_DENOM;
        let rake_bps = self.house_rake_bps().get() as u64;
        let user_bps = BPS_DENOM - rake_bps;
        gross * user_bps / BPS_DENOM
    }

    fn settle_egld(
        &self,
        spin_id: u64,
        pending: &PendingSpin<Self::Api>,
        outcome: SpinOutcome,
        roll: u16,
        entropy_hash: &ManagedByteArray<Self::Api, 32>,
        resolve_block: u64,
    ) {
        let bet = &pending.bet;
        let contrib_bps = self.progressive_contrib_bps().get() as u64;
        let to_progressive = bet * contrib_bps / BPS_DENOM;
        self.progressive_egld().update(|p| *p += &to_progressive);
        self.total_wagered_egld().update(|t| *t += bet);

        let mut payout = BigUint::zero();
        let mut progressive_paid = BigUint::zero();

        match outcome {
            SpinOutcome::Grand => {
                let pot = self.progressive_egld().get();
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
            SpinOutcome::Lose => {}
        }

        if payout > 0 {
            let balance = self
                .blockchain()
                .get_sc_balance(&EgldOrEsdtTokenIdentifier::egld(), 0);
            if payout > balance {
                payout = balance.clone();
            }
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
                self.send().direct_egld(&pending.player, &payout);
                self.total_paid_egld().update(|t| *t += &payout);
            }
        }

        self.spin_resolved_event(
            spin_id,
            &pending.player,
            bet,
            &payout,
            &to_progressive,
            &progressive_paid,
            outcome,
            roll,
            entropy_hash,
            pending.lock_block,
            resolve_block,
        );
    }

    fn settle_esdt(
        &self,
        spin_id: u64,
        pending: &PendingSpin<Self::Api>,
        outcome: SpinOutcome,
        roll: u16,
        entropy_hash: &ManagedByteArray<Self::Api, 32>,
        resolve_block: u64,
    ) {
        let bet = &pending.bet;
        let token = &pending.token;
        let contrib_bps = self.progressive_contrib_bps().get() as u64;
        let to_progressive = bet * contrib_bps / BPS_DENOM;
        self.progressive_esdt(token).update(|p| *p += &to_progressive);
        self.total_wagered_esdt(token).update(|t| *t += bet);

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
                    .direct_esdt(&pending.player, token, 0, &payout);
                self.total_paid_esdt(token).update(|t| *t += &payout);
            }
        }

        self.spin_resolved_esdt_event(
            spin_id,
            &pending.player,
            token,
            bet,
            &payout,
            &to_progressive,
            &progressive_paid,
            outcome,
            roll,
            entropy_hash,
            pending.lock_block,
            resolve_block,
        );
    }

    // ─── Views / verify ──────────────────────────────────────

    /// Off-chain: recompute keccak and roll from published event fields + block seed.
    #[view(getPendingSpin)]
    fn get_pending_spin_view(
        &self,
        spin_id: u64,
    ) -> OptionalValue<PendingSpin<Self::Api>> {
        if self.pending_spin(spin_id).is_empty() {
            OptionalValue::None
        } else {
            OptionalValue::Some(self.pending_spin(spin_id).get())
        }
    }

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

    #[view(getResolveDelayBlocks)]
    #[storage_mapper("resolve_delay_blocks")]
    fn resolve_delay_blocks(&self) -> SingleValueMapper<u64>;

    #[view(getTimeoutBlocks)]
    #[storage_mapper("timeout_blocks")]
    fn timeout_blocks(&self) -> SingleValueMapper<u64>;

    #[view(isPaused)]
    #[storage_mapper("paused")]
    fn paused(&self) -> SingleValueMapper<bool>;

    #[view(getOwner)]
    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[view(isPaymentTokenAllowed)]
    #[storage_mapper("payment_token_allowed")]
    fn payment_token_allowed(&self, token: &TokenIdentifier) -> SingleValueMapper<bool>;

    #[view(getUserPendingCount)]
    #[storage_mapper("user_pending_count")]
    fn user_pending_count(&self, user: &ManagedAddress) -> SingleValueMapper<u32>;

    #[storage_mapper("pending_spin")]
    fn pending_spin(&self, spin_id: u64) -> SingleValueMapper<PendingSpin<Self::Api>>;

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

    #[event("spinLocked")]
    fn spin_locked_event(
        &self,
        #[indexed] spin_id: u64,
        #[indexed] player: &ManagedAddress,
        bet: &BigUint,
        client_seed: &ManagedBuffer,
        lock_block: u64,
        is_egld: bool,
    );

    #[event("spinLockedEsdt")]
    fn spin_locked_esdt_event(
        &self,
        #[indexed] spin_id: u64,
        #[indexed] player: &ManagedAddress,
        #[indexed] token: &TokenIdentifier,
        bet: &BigUint,
        client_seed: &ManagedBuffer,
        lock_block: u64,
    );

    #[event("spinResolved")]
    fn spin_resolved_event(
        &self,
        #[indexed] spin_id: u64,
        #[indexed] player: &ManagedAddress,
        bet: &BigUint,
        payout: &BigUint,
        to_progressive: &BigUint,
        progressive_paid: &BigUint,
        outcome: SpinOutcome,
        roll: u16,
        entropy_hash: &ManagedByteArray<Self::Api, 32>,
        lock_block: u64,
        resolve_block: u64,
    );

    #[event("spinResolvedEsdt")]
    fn spin_resolved_esdt_event(
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
        entropy_hash: &ManagedByteArray<Self::Api, 32>,
        lock_block: u64,
        resolve_block: u64,
    );

    #[event("spinRefund")]
    fn spin_refund_event(
        &self,
        #[indexed] spin_id: u64,
        #[indexed] player: &ManagedAddress,
        bet: &BigUint,
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
