#![no_std]

//! xArtists Slot Casino — MultiversX 0.66 (Provably Fair core)

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

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, PartialEq, Eq, Clone, Copy)]
pub enum SpinOutcome {
    Lose,
    Pair,
    Diagonal,
    Line3,
    Grand,
}

#[type_abi]
#[derive(TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
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

    #[upgrade]
    fn upgrade(&self) {
        self.require_owner();
    }

    fn require_owner(&self) {
        require!(self.blockchain().get_caller() == self.owner().get(), "only owner");
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
        require!(bps <= MAX_BPS, "too high");
        self.progressive_contrib_bps().set(bps);
    }

    #[endpoint(setHouseRakeBps)]
    fn set_house_rake_bps(&self, bps: u16) {
        self.require_owner();
        require!(bps <= MAX_BPS, "too high");
        self.house_rake_bps().set(bps);
    }

    #[endpoint(setMinBet)]
    fn set_min_bet(&self, min_bet: BigUint) {
        self.require_owner();
        require!(min_bet > 0, "zero");
        self.min_bet().set(&min_bet);
    }

    #[endpoint(setResolveDelayBlocks)]
    fn set_resolve_delay_blocks(&self, delay: u64) {
        self.require_owner();
        self.resolve_delay_blocks().set(delay);
    }

    #[endpoint(setTimeoutBlocks)]
    fn set_timeout_blocks(&self, blocks: u64) {
        self.require_owner();
        require!(blocks > self.resolve_delay_blocks().get(), "timeout <= delay");
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
        let payment = self.call_value().egld().clone_value();
        require!(payment > 0, "zero");
        self.progressive_egld().update(|p| *p += &payment);
        self.fund_progressive_event(&payment);
    }

    #[payable("*")]
    #[endpoint(fundProgressiveEsdt)]
    fn fund_progressive_esdt(&self) {
        self.require_owner();
        let payment = self.call_value().single_esdt();
        require!(payment.token_nonce == 0, "fungible only");
        require!(payment.amount > 0, "zero");
        self.progressive_esdt(&payment.token_identifier)
            .update(|p| *p += &payment.amount);
        self.fund_progressive_event(&payment.amount);
    }

    #[endpoint(transferOwnership)]
    fn transfer_ownership(&self, new_owner: ManagedAddress) {
        self.require_owner();
        require!(!new_owner.is_zero(), "zero");
        self.pending_owner().set(&new_owner);
    }

    #[endpoint(acceptOwnership)]
    fn accept_ownership(&self) {
        let caller = self.blockchain().get_caller();
        require!(!self.pending_owner().is_empty(), "no pending");
        require!(caller == self.pending_owner().get(), "not pending");
        self.owner().set(&caller);
        self.pending_owner().clear();
    }

    #[endpoint(claimHouseEgld)]
    fn claim_house_egld(&self) {
        self.require_owner();
        let bal = self.blockchain().get_sc_balance(&EgldOrEsdtTokenIdentifier::egld(), 0);
        let progressive = self.progressive_egld().get();
        require!(bal > progressive, "nothing");
        let claimable = &bal - &progressive;
        let owner = self.owner().get();
        self.send().direct_egld(&owner, &claimable);
        self.claim_house_event(&owner, &claimable);
    }

    #[endpoint(claimHouseEsdt)]
    fn claim_house_esdt(&self, token: TokenIdentifier) {
        self.require_owner();
        let bal = self.blockchain().get_sc_balance(&EgldOrEsdtTokenIdentifier::esdt(token.clone()), 0);
        let progressive = self.progressive_esdt(&token).get();
        require!(bal > progressive, "nothing");
        let claimable = &bal - &progressive;
        let owner = self.owner().get();
        self.send().direct_esdt(&owner, &token, 0, &claimable);
        self.claim_house_event(&owner, &claimable);
    }

    // --- play ---

    #[payable("EGLD")]
    #[endpoint(spinEgld)]
    fn spin_egld(&self, client_seed: ManagedBuffer) {
        self.require_not_paused();
        let payment = self.call_value().egld().clone_value();
        self.internal_spin(true, TokenIdentifier::from(""), payment, client_seed);
    }

    #[payable("*")]
    #[endpoint(spinEsdt)]
    fn spin_esdt(&self, client_seed: ManagedBuffer) {
        self.require_not_paused();
        let payment = self.call_value().single_esdt();
        require!(payment.token_nonce == 0, "fungible only");
        require!(self.payment_token_allowed(&payment.token_identifier).get(), "token not allowed");
        self.internal_spin(false, payment.token_identifier, payment.amount, client_seed);
    }

    fn internal_spin(
        &self,
        is_egld: bool,
        token: TokenIdentifier,
        bet: BigUint,
        client_seed: ManagedBuffer,
    ) {
        require!(bet >= self.min_bet().get(), "below min bet");
        require!(client_seed.len() > 0 && client_seed.len() <= MAX_CLIENT_SEED_LEN, "bad seed");
        let player = self.blockchain().get_caller();
        let pending_count = self.user_pending_count(&player).get();
        require!(pending_count < MAX_PENDING_PER_USER, "too many pending");

        let block = self.blockchain().get_block_nonce();
        let resolve_after = block + self.resolve_delay_blocks().get();
        let timeout_block = block + self.timeout_blocks().get();

        let spin_id = self.spin_count().get() + 1;
        self.spin_count().set(spin_id);

        let pending = PendingSpin {
            player: player.clone(),
            is_egld,
            token: token.clone(),
            bet: bet.clone(),
            client_seed: client_seed.clone(),
            lock_block: block,
            resolve_after,
            timeout_block,
        };
        self.pending_spins(spin_id).set(&pending);
        self.user_pending_count(&player).set(pending_count + 1);

        if is_egld {
            self.total_wagered_egld().update(|t| *t += &bet);
            let contrib_bps = self.progressive_contrib_bps().get() as u64;
            if contrib_bps > 0 {
                let contrib = &bet * contrib_bps / BPS_DENOM;
                self.progressive_egld().update(|p| *p += contrib);
            }
        }

        self.spin_locked_event(spin_id, &player, &bet);
    }

    #[endpoint(resolveSpin)]
    fn resolve_spin(&self, spin_id: u64) {
        self.require_not_paused();
        require!(!self.pending_spins(spin_id).is_empty(), "no spin");
        let pending = self.pending_spins(spin_id).get();
        let block = self.blockchain().get_block_nonce();
        require!(block >= pending.resolve_after, "too early");
        require!(block <= pending.timeout_block, "timed out — refund");

        let seed = self.build_seed(&pending);
        let roll = self.roll_from_seed(&seed);
        let outcome = self.outcome_from_roll(roll);
        let payout = self.payout_for_outcome(&pending.bet, outcome);

        self.pending_spins(spin_id).clear();
        let pc = self.user_pending_count(&pending.player).get();
        if pc > 0 {
            self.user_pending_count(&pending.player).set(pc - 1);
        }

        if payout > 0 {
            if pending.is_egld {
                let house_bal = self.blockchain().get_sc_balance(&EgldOrEsdtTokenIdentifier::egld(), 0);
                let progressive = self.progressive_egld().get();
                let available = if house_bal > progressive {
                    &house_bal - &progressive
                } else {
                    BigUint::zero()
                };
                let pay = if &payout > &available { available } else { payout.clone() };
                if pay > 0 {
                    self.send().direct_egld(&pending.player, &pay);
                    self.total_paid_egld().update(|t| *t += &pay);
                }
                if outcome == SpinOutcome::Grand {
                    let jackpot = self.progressive_egld().get();
                    if jackpot > 0 {
                        self.send().direct_egld(&pending.player, &jackpot);
                        self.progressive_egld().set(BigUint::zero());
                        self.grand_count().update(|c| *c += 1);
                        self.total_paid_egld().update(|t| *t += &jackpot);
                    }
                }
            } else {
                self.send()
                    .direct_esdt(&pending.player, &pending.token, 0, &payout);
            }
        }

        self.spin_resolved_event(spin_id, &pending.player, &payout);
    }

    #[endpoint(refundSpin)]
    fn refund_spin(&self, spin_id: u64) {
        require!(!self.pending_spins(spin_id).is_empty(), "no spin");
        let pending = self.pending_spins(spin_id).get();
        let block = self.blockchain().get_block_nonce();
        require!(block > pending.timeout_block, "not timed out");

        self.pending_spins(spin_id).clear();
        let pc = self.user_pending_count(&pending.player).get();
        if pc > 0 {
            self.user_pending_count(&pending.player).set(pc - 1);
        }

        if pending.is_egld {
            self.send().direct_egld(&pending.player, &pending.bet);
        } else {
            self.send()
                .direct_esdt(&pending.player, &pending.token, 0, &pending.bet);
        }
        self.spin_refund_event(spin_id, &pending.player, &pending.bet);
    }

    fn build_seed(&self, pending: &PendingSpin<Self::Api>) -> ManagedBuffer {
        let mut buf = ManagedBuffer::new();
        buf.append(&pending.client_seed);
        // provably-fair: client_seed + lock_block + current block nonce + round
        let lock_bytes = pending.lock_block.to_be_bytes();
        buf.append(&ManagedBuffer::new_from_bytes(&lock_bytes));
        let cur = self.blockchain().get_block_nonce().to_be_bytes();
        buf.append(&ManagedBuffer::new_from_bytes(&cur));
        let prev = self.blockchain().get_block_round().to_be_bytes();
        buf.append(&ManagedBuffer::new_from_bytes(&prev));
        buf
    }

    fn roll_from_seed(&self, seed: &ManagedBuffer) -> u16 {
        let hash = self.crypto().keccak256(seed);
        let mut arr = [0u8; 2];
        let _ = hash.as_managed_buffer().load_slice(0, &mut arr);
        u16::from_be_bytes(arr)
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

    fn payout_for_outcome(&self, bet: &BigUint, outcome: SpinOutcome) -> BigUint {
        match outcome {
            SpinOutcome::Lose => BigUint::zero(),
            SpinOutcome::Pair => bet * MULT_PAIR_BPS / BPS_DENOM,
            SpinOutcome::Diagonal => bet * MULT_DIAG_BPS / BPS_DENOM,
            SpinOutcome::Line3 => bet * MULT_LINE_BPS / BPS_DENOM,
            SpinOutcome::Grand => BigUint::zero(), // jackpot paid separately from progressive
        }
    }

    // --- views ---

    #[view(getOwner)]
    fn get_owner(&self) -> ManagedAddress {
        self.owner().get()
    }

    #[view(isPaused)]
    fn is_paused(&self) -> bool {
        self.paused().get()
    }

    #[view(getProgressiveContribBps)]
    fn get_progressive_contrib_bps(&self) -> u16 {
        self.progressive_contrib_bps().get()
    }

    #[view(getHouseRakeBps)]
    fn get_house_rake_bps(&self) -> u16 {
        self.house_rake_bps().get()
    }

    #[view(getMinBet)]
    fn get_min_bet(&self) -> BigUint {
        self.min_bet().get()
    }

    #[view(getProgressiveEgld)]
    fn get_progressive_egld(&self) -> BigUint {
        self.progressive_egld().get()
    }

    #[view(getSpinCount)]
    fn get_spin_count(&self) -> u64 {
        self.spin_count().get()
    }

    #[view(getTotalWageredEgld)]
    fn get_total_wagered_egld(&self) -> BigUint {
        self.total_wagered_egld().get()
    }

    #[view(getTotalPaidEgld)]
    fn get_total_paid_egld(&self) -> BigUint {
        self.total_paid_egld().get()
    }

    #[view(getGrandCount)]
    fn get_grand_count(&self) -> u64 {
        self.grand_count().get()
    }

    #[view(getPendingSpin)]
    fn get_pending_spin(&self, spin_id: u64) -> OptionalValue<PendingSpin<Self::Api>> {
        if self.pending_spins(spin_id).is_empty() {
            OptionalValue::None
        } else {
            OptionalValue::Some(self.pending_spins(spin_id).get())
        }
    }

    // --- storage ---

    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("pendingOwner")]
    fn pending_owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("paused")]
    fn paused(&self) -> SingleValueMapper<bool>;

    #[storage_mapper("progressiveContribBps")]
    fn progressive_contrib_bps(&self) -> SingleValueMapper<u16>;

    #[storage_mapper("houseRakeBps")]
    fn house_rake_bps(&self) -> SingleValueMapper<u16>;

    #[storage_mapper("minBet")]
    fn min_bet(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("resolveDelayBlocks")]
    fn resolve_delay_blocks(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("timeoutBlocks")]
    fn timeout_blocks(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("progressiveEgld")]
    fn progressive_egld(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("progressiveEsdt")]
    fn progressive_esdt(&self, token: &TokenIdentifier) -> SingleValueMapper<BigUint>;

    #[storage_mapper("paymentTokenAllowed")]
    fn payment_token_allowed(&self, token: &TokenIdentifier) -> SingleValueMapper<bool>;

    #[storage_mapper("spinCount")]
    fn spin_count(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("totalWageredEgld")]
    fn total_wagered_egld(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("totalPaidEgld")]
    fn total_paid_egld(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("grandCount")]
    fn grand_count(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("pendingSpins")]
    fn pending_spins(&self, spin_id: u64) -> SingleValueMapper<PendingSpin<Self::Api>>;

    #[storage_mapper("userPendingCount")]
    fn user_pending_count(&self, user: &ManagedAddress) -> SingleValueMapper<u32>;

    // --- events (1 data arg) ---

    #[event("spinLocked")]
    fn spin_locked_event(&self, #[indexed] spin_id: u64, #[indexed] player: &ManagedAddress, bet: &BigUint);

    #[event("spinResolved")]
    fn spin_resolved_event(&self, #[indexed] spin_id: u64, #[indexed] player: &ManagedAddress, payout: &BigUint);

    #[event("spinRefund")]
    fn spin_refund_event(&self, #[indexed] spin_id: u64, #[indexed] player: &ManagedAddress, bet: &BigUint);

    #[event("fundProgressive")]
    fn fund_progressive_event(&self, amount: &BigUint);

    #[event("claimHouse")]
    fn claim_house_event(&self, #[indexed] to: &ManagedAddress, amount: &BigUint);
}
