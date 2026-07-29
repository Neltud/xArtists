#![no_std]

//! Agents Marketplace — list / buy / execute agent actions (LIA + third-party)
//! Deploy with mxpy; replace placeholder address in frontend config after deploy.

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

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
        require!(fee_bps <= 1000, "fee too high"); // max 10%
        self.marketplace_fee_bps().set(fee_bps);
        self.listing_count().set(0u64);
    }

    #[upgrade]
    fn upgrade(&self) {}

    /// List an agent action / signal package for sale
    #[endpoint(listAgentAction)]
    fn list_agent_action(&self, agent_id: ManagedBuffer, price: BigUint) {
        require!(price > 0, "price must be > 0");
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
        let mut listing = self.listings(listing_id).get();
        require!(listing.active, "listing inactive");
        let payment = self.call_value().egld_value();
        require!(*payment >= listing.price, "insufficient payment");

        let fee_bps = self.marketplace_fee_bps().get() as u64;
        let fee = &listing.price * fee_bps / 10_000u64;
        let to_seller = &listing.price - &fee;

        self.send().direct_egld(&listing.seller, &to_seller);
        // fee stays in contract (treasury claimable by owner)

        listing.active = false;
        self.listings(listing_id).set(listing);
        self.buy_event(listing_id, &self.blockchain().get_caller());
    }

    #[endpoint(cancelListing)]
    fn cancel_listing(&self, listing_id: u64) {
        let mut listing = self.listings(listing_id).get();
        require!(listing.active, "inactive");
        require!(
            listing.seller == self.blockchain().get_caller(),
            "only seller"
        );
        listing.active = false;
        self.listings(listing_id).set(listing);
    }

    #[view(getListing)]
    fn get_listing(&self, listing_id: u64) -> OptionalValue<AgentListing<Self::Api>> {
        if self.listings(listing_id).is_empty() {
            OptionalValue::None
        } else {
            OptionalValue::Some(self.listings(listing_id).get())
        }
    }

    #[event("list")]
    fn list_event(&self, #[indexed] id: u64, #[indexed] seller: &ManagedAddress);

    #[event("buy")]
    fn buy_event(&self, #[indexed] id: u64, #[indexed] buyer: &ManagedAddress);

    #[view]
    #[storage_mapper("feeBps")]
    fn marketplace_fee_bps(&self) -> SingleValueMapper<u16>;

    #[view]
    #[storage_mapper("listingCount")]
    fn listing_count(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("listings")]
    fn listings(&self, id: u64) -> SingleValueMapper<AgentListing<Self::Api>>;
}
