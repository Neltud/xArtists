#![no_std]

//! xArtists Venue Split — immutable economics post-deploy.
//! Split bps (sum 10_000): institution 4000 | associations 2000 | LIA 2500 | holders 1500
//! Deploy testnet first · mainnet only after audit + GO_LIVE.

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

const BPS_TOTAL: u64 = 10_000;
const BPS_INSTITUTION: u64 = 4_000;
const BPS_ASSOCIATIONS: u64 = 2_000;
const BPS_LIA: u64 = 2_500;
const BPS_HOLDERS: u64 = 1_500;

#[multiversx_sc::contract]
pub trait VenueSplit {
    /// init(institution, associations, lia_treasury, holders_pool)
    #[init]
    fn init(
        self,
        institution: ManagedAddress,
        associations: ManagedAddress,
        lia_treasury: ManagedAddress,
        holders_pool: ManagedAddress,
    ) {
        require!(!institution.is_zero(), "institution zero");
        require!(!associations.is_zero(), "associations zero");
        require!(!lia_treasury.is_zero(), "lia zero");
        require!(!holders_pool.is_zero(), "holders zero");
        self.institution().set(&institution);
        self.associations().set(&associations);
        self.lia_treasury().set(&lia_treasury);
        self.holders_pool().set(&holders_pool);
        self.paused().set(false);
        let caller = self.blockchain().get_caller();
        self.owner().set(&caller);
        // economics immutable — no set_split endpoint
    }

    #[upgrade]
    fn upgrade(&self) {
        // intentional no-op body: upgrade endpoint present for toolchain only;
        // policy = treat as immutable (do not upgrade after GO_LIVE)
        self.require_owner();
    }

    fn require_owner(&self) {
        require!(
            self.blockchain().get_caller() == self.owner().get(),
            "only owner"
        );
    }

    fn require_not_paused(&self) {
        require!(!self.paused().get(), "paused");
    }

    /// Emergency pause only — cannot change split or sweep funds.
    #[endpoint(setPaused)]
    fn set_paused(&self, value: bool) {
        self.require_owner();
        self.paused().set(value);
    }

    /// Pay rent in EGLD — split to 4 buckets by immutable bps.
    #[payable("EGLD")]
    #[endpoint(rentPay)]
    fn rent_pay(&self, tier_id: ManagedBuffer) {
        self.require_not_paused();
        let payment = self.call_value().egld().clone_value();
        require!(payment > 0u64, "zero payment");
        self.distribute_egld(&payment, &tier_id);
    }

    /// Pay rent in a single ESDT (e.g. USDC) — same bps.
    #[payable("*")]
    #[endpoint(rentPayEsdt)]
    fn rent_pay_esdt(&self, tier_id: ManagedBuffer) {
        self.require_not_paused();
        let payment = self.call_value().single_esdt().clone();
        let (token_id, nonce, amount) = payment.into_tuple();
        require!(amount > 0u64, "zero payment");
        require!(nonce == 0, "only fungible ESDT");
        self.distribute_esdt(&token_id, &amount, &tier_id);
    }

    fn distribute_egld(&self, amount: &BigUint, tier_id: &ManagedBuffer) {
        let inst = amount * BPS_INSTITUTION / BPS_TOTAL;
        let assoc = amount * BPS_ASSOCIATIONS / BPS_TOTAL;
        let lia = amount * BPS_LIA / BPS_TOTAL;
        let holders = amount - &inst - &assoc - &lia; // dust → holders

        self.send()
            .direct_egld(&self.institution().get(), &inst);
        self.send()
            .direct_egld(&self.associations().get(), &assoc);
        self.send()
            .direct_egld(&self.lia_treasury().get(), &lia);
        self.send()
            .direct_egld(&self.holders_pool().get(), &holders);

        self.rent_paid_event(
            &self.blockchain().get_caller(),
            tier_id,
            &ManagedBuffer::from("EGLD"),
            amount,
        );
        self.total_egld_routed()
            .update(|v| *v += amount);
    }

    fn distribute_esdt(
        &self,
        token_id: &TokenIdentifier,
        amount: &BigUint,
        tier_id: &ManagedBuffer,
    ) {
        let inst = amount * BPS_INSTITUTION / BPS_TOTAL;
        let assoc = amount * BPS_ASSOCIATIONS / BPS_TOTAL;
        let lia = amount * BPS_LIA / BPS_TOTAL;
        let holders = amount - &inst - &assoc - &lia;

        self.send()
            .direct_esdt(&self.institution().get(), token_id, 0, &inst);
        self.send()
            .direct_esdt(&self.associations().get(), token_id, 0, &assoc);
        self.send()
            .direct_esdt(&self.lia_treasury().get(), token_id, 0, &lia);
        self.send()
            .direct_esdt(&self.holders_pool().get(), token_id, 0, &holders);

        self.rent_paid_event(
            &self.blockchain().get_caller(),
            tier_id,
            token_id.as_managed_buffer(),
            amount,
        );
    }

    #[view(getSplitBps)]
    fn get_split_bps(&self) -> MultiValue4<u64, u64, u64, u64> {
        (
            BPS_INSTITUTION,
            BPS_ASSOCIATIONS,
            BPS_LIA,
            BPS_HOLDERS,
        )
            .into()
    }

    #[view(getBuckets)]
    fn get_buckets(
        &self,
    ) -> MultiValue4<ManagedAddress, ManagedAddress, ManagedAddress, ManagedAddress> {
        (
            self.institution().get(),
            self.associations().get(),
            self.lia_treasury().get(),
            self.holders_pool().get(),
        )
            .into()
    }

    #[view(getPaused)]
    fn get_paused(&self) -> bool {
        self.paused().get()
    }

    #[view(getTotalEgldRouted)]
    fn get_total_egld_routed(&self) -> BigUint {
        self.total_egld_routed().get()
    }

    #[event("rentPaid")]
    fn rent_paid_event(
        &self,
        #[indexed] payer: &ManagedAddress,
        #[indexed] tier_id: &ManagedBuffer,
        #[indexed] token: &ManagedBuffer,
        amount: &BigUint,
    );

    #[storage_mapper("institution")]
    fn institution(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("associations")]
    fn associations(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("liaTreasury")]
    fn lia_treasury(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("holdersPool")]
    fn holders_pool(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("paused")]
    fn paused(&self) -> SingleValueMapper<bool>;

    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("totalEgldRouted")]
    fn total_egld_routed(&self) -> SingleValueMapper<BigUint>;
}
