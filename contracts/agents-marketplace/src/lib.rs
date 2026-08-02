#![no_std]

//! Agents Marketplace — list / buy / cancel agent actions (LIA + third-party)
//! Fee tracked in accumulated_fees; owner claims via claimFees.
//! Security: pause, CEI, upgrade gated by storage owner, 2-step ownership, agent_id len cap.
//! Note: access control uses storage `owner` (not framework #[only_owner]) so transferOwnership works.

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

const MAX_AGENT_ID_LEN: usize = 64;
const MAX_FEE_BPS: u16 = 1000;

#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct AgentListing<M: ManagedTypeApi> {
    pub seller: ManagedAddress<M>,
    pub agent_id: ManagedBuffer<M>,
    pub price: BigUint<M>,
    pub active: bool,
}

#[multiversx_sc::contract]
pub trait AgentsMarketplace {
    #[init]
    fn init(&self, fee_bps: u16) {
        require!(fee_bps <= MAX_FEE_BPS, "fee too high");
        self.marketplace_fee_bps().set(fee_bps);
        self.listing_count().set(0u64);
        self.accumulated_fees().set(BigUint::zero());
        self.paused().set(false);
        let caller = self.blockchain().get_caller();
        self.owner().set(&caller);
        self.pending_owner().clear();
    }

    /// Upgrade callable only by storage owner (redeploy path still governed by chain owner policy)
    #[endpoint(upgrade)]
    fn upgrade(&self) {
        self.require_owner();
    }

    fn require_owner(&self) {
        require!(
            self.blockchain().get_caller() == self.owner().get(),
            "only owner"
        );
    }

    // ─── Admin ───────────────────────────────────────────────

    #[endpoint(setPaused)]
    fn set_paused(&self, value: bool) {
        self.require_owner();
        self.paused().set(value);
    }

    #[endpoint(setFeeBps)]
    fn set_fee_bps(&self, fee_bps: u16) {
        self.require_owner();
        require!(fee_bps <= MAX_FEE_BPS, "fee too high");
        self.marketplace_fee_bps().set(fee_bps);
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

    #[endpoint(claimFees)]
    fn claim_fees(&self) {
        self.require_owner();
        let fees = self.accumulated_fees().get();
        require!(fees > 0, "nothing to claim");
        self.accumulated_fees().set(BigUint::zero());
        let owner = self.owner().get();
        self.send().direct_egld(&owner, &fees);
        self.claim_event(&owner, &fees);
    }

    // ─── Market ──────────────────────────────────────────────

    #[endpoint(listAgentAction)]
    fn list_agent_action(&self, agent_id: ManagedBuffer, price: BigUint) {
        require!(!self.paused().get(), "paused");
        require!(price > 0, "price must be > 0");
        require!(
            agent_id.len() > 0 && agent_id.len() <= MAX_AGENT_ID_LEN,
            "invalid agent_id length"
        );

        let seller = self.blockchain().get_caller();
        let id = self.listing_count().get() + 1;
        self.listing_count().set(id);
        self.listings(id).set(AgentListing {
            seller: seller.clone(),
            agent_id,
            price,
            active: true,
        });
        self.list_event(id, &seller);
    }

    #[payable("EGLD")]
    #[endpoint(buyAgentAction)]
    fn buy_agent_action(&self, listing_id: u64) {
        require!(!self.paused().get(), "paused");
        require!(!self.listings(listing_id).is_empty(), "listing not found");

        let mut listing = self.listings(listing_id).get();
        require!(listing.active, "listing inactive");

        let payment = self.call_value().egld_value().clone_value();
        require!(payment >= listing.price, "insufficient payment");

        let fee_bps = self.marketplace_fee_bps().get() as u64;
        let fee = &listing.price * fee_bps / 10_000u64;
        let to_seller = &listing.price - &fee;
        let buyer = self.blockchain().get_caller();

        // CEI
        listing.active = false;
        self.listings(listing_id).set(listing.clone());
        if fee > 0 {
            self.accumulated_fees().update(|f| *f += &fee);
        }

        if to_seller > 0 {
            self.send().direct_egld(&listing.seller, &to_seller);
        }

        let excess = &payment - &listing.price;
        if excess > 0 {
            self.send().direct_egld(&buyer, &excess);
        }

        self.buy_event(listing_id, &buyer);
    }

    #[endpoint(cancelListing)]
    fn cancel_listing(&self, listing_id: u64) {
        require!(!self.listings(listing_id).is_empty(), "listing not found");
        let mut listing = self.listings(listing_id).get();
        require!(listing.active, "inactive");
        require!(
            listing.seller == self.blockchain().get_caller(),
            "only seller"
        );
        listing.active = false;
        self.listings(listing_id).set(listing);
    }

    // ─── Views ───────────────────────────────────────────────

    #[view(getListing)]
    fn get_listing(&self, listing_id: u64) -> OptionalValue<AgentListing<Self::Api>> {
        if self.listings(listing_id).is_empty() {
            OptionalValue::None
        } else {
            OptionalValue::Some(self.listings(listing_id).get())
        }
    }

    #[view(getFeeBps)]
    fn get_fee_bps(&self) -> u16 {
        self.marketplace_fee_bps().get()
    }

    #[view(getAccumulatedFees)]
    fn get_accumulated_fees(&self) -> BigUint {
        self.accumulated_fees().get()
    }

    #[view(getContractEgldBalance)]
    fn get_contract_egld_balance(&self) -> BigUint {
        self.blockchain()
            .get_sc_balance(&EgldOrEsdtTokenIdentifier::egld(), 0)
    }

    #[view(getOwner)]
    fn get_owner_view(&self) -> ManagedAddress {
        self.owner().get()
    }

    #[view(getPendingOwner)]
    fn get_pending_owner(&self) -> OptionalValue<ManagedAddress> {
        if self.pending_owner().is_empty() {
            OptionalValue::None
        } else {
            OptionalValue::Some(self.pending_owner().get())
        }
    }

    #[view(isPaused)]
    fn is_paused(&self) -> bool {
        self.paused().get()
    }

    #[event("list")]
    fn list_event(&self, #[indexed] id: u64, #[indexed] seller: &ManagedAddress);

    #[event("buy")]
    fn buy_event(&self, #[indexed] id: u64, #[indexed] buyer: &ManagedAddress);

    #[event("claim")]
    fn claim_event(&self, #[indexed] owner: &ManagedAddress, amount: &BigUint);

    #[view]
    #[storage_mapper("feeBps")]
    fn marketplace_fee_bps(&self) -> SingleValueMapper<u16>;

    #[view]
    #[storage_mapper("listingCount")]
    fn listing_count(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("listings")]
    fn listings(&self, id: u64) -> SingleValueMapper<AgentListing<Self::Api>>;

    #[view]
    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("pendingOwner")]
    fn pending_owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[view]
    #[storage_mapper("paused")]
    fn paused(&self) -> SingleValueMapper<bool>;

    #[view]
    #[storage_mapper("accumulatedFees")]
    fn accumulated_fees(&self) -> SingleValueMapper<BigUint>;
}
