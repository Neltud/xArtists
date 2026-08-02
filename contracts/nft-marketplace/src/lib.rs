#![no_std]

//! xArtists NFT Marketplace — MultiversX
//! listNft / buyNft / cancelListing + creator royalty + marketplace fee
//! Security: pause, CEI, upgrade only owner, 2-step ownership, fee+royalty cap, excess refund

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

const MAX_FEE_BPS: u16 = 1000;
const MAX_ROYALTY_BPS: u16 = 1000;
const BPS_DENOM: u64 = 10_000;

#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct Listing<M: ManagedTypeApi> {
    pub seller: ManagedAddress<M>,
    pub token_id: TokenIdentifier<M>,
    pub nonce: u64,
    pub price: BigUint<M>,
    pub royalty_bps: u16,
    pub royalty_receiver: ManagedAddress<M>,
    pub active: bool,
}

#[multiversx_sc::contract]
pub trait NftMarketplace {
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

    #[only_owner]
    #[endpoint(upgrade)]
    fn upgrade(&self) {}

    // ─── Admin ───────────────────────────────────────────────

    #[only_owner]
    #[endpoint(setPaused)]
    fn set_paused(&self, value: bool) {
        self.paused().set(value);
    }

    #[only_owner]
    #[endpoint(setFeeBps)]
    fn set_fee_bps(&self, fee_bps: u16) {
        require!(fee_bps <= MAX_FEE_BPS, "fee too high");
        self.marketplace_fee_bps().set(fee_bps);
    }

    #[only_owner]
    #[endpoint(transferOwnership)]
    fn transfer_ownership(&self, new_owner: ManagedAddress) {
        require!(!new_owner.is_zero(), "zero address");
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

    #[only_owner]
    #[endpoint(claimFees)]
    fn claim_fees(&self) {
        let fees = self.accumulated_fees().get();
        require!(fees > 0, "nothing to claim");
        self.accumulated_fees().set(BigUint::zero());
        let owner = self.owner().get();
        self.send().direct_egld(&owner, &fees);
        self.claim_event(&owner, &fees);
    }

    // ─── Market ──────────────────────────────────────────────

    #[payable("*")]
    #[endpoint(listNft)]
    fn list_nft(
        &self,
        price: BigUint,
        royalty_bps: u16,
        royalty_receiver: ManagedAddress,
    ) {
        require!(!self.paused().get(), "paused");
        require!(price > 0, "price > 0");
        require!(royalty_bps <= MAX_ROYALTY_BPS, "royalty too high");

        let fee_bps = self.marketplace_fee_bps().get();
        require!(
            (fee_bps as u32) + (royalty_bps as u32) <= 10_000,
            "fee+royalty exceed 100%"
        );

        let payment = self.call_value().single_esdt();
        require!(payment.amount == BigUint::from(1u32), "send 1 NFT");

        let seller = self.blockchain().get_caller();
        let id = self.listing_count().get() + 1;
        self.listing_count().set(id);

        self.listings(id).set(Listing {
            seller: seller.clone(),
            token_id: payment.token_identifier,
            nonce: payment.token_nonce,
            price,
            royalty_bps,
            royalty_receiver,
            active: true,
        });

        self.list_event(id, &seller);
    }

    #[payable("EGLD")]
    #[endpoint(buyNft)]
    fn buy_nft(&self, listing_id: u64) {
        require!(!self.paused().get(), "paused");
        require!(!self.listings(listing_id).is_empty(), "listing not found");

        let mut listing = self.listings(listing_id).get();
        require!(listing.active, "inactive");

        let payment = self.call_value().egld_value().clone_value();
        require!(payment >= listing.price, "insufficient payment");

        let fee_bps = self.marketplace_fee_bps().get() as u64;
        let royalty_bps = listing.royalty_bps as u64;
        require!(fee_bps + royalty_bps <= BPS_DENOM, "fee+royalty exceed 100%");

        let fee = &listing.price * fee_bps / BPS_DENOM;
        let royalty = &listing.price * royalty_bps / BPS_DENOM;
        let to_seller = &listing.price - &fee - &royalty;
        let buyer = self.blockchain().get_caller();

        // CEI: effects before interactions
        listing.active = false;
        self.listings(listing_id).set(listing.clone());
        if fee > 0 {
            self.accumulated_fees()
                .update(|f| *f += &fee);
        }

        self.send().direct_esdt(
            &buyer,
            &listing.token_id,
            listing.nonce,
            &BigUint::from(1u32),
        );

        if to_seller > 0 {
            self.send().direct_egld(&listing.seller, &to_seller);
        }
        if royalty > 0 && !listing.royalty_receiver.is_zero() {
            self.send().direct_egld(&listing.royalty_receiver, &royalty);
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

        // CEI
        listing.active = false;
        self.listings(listing_id).set(listing.clone());

        self.send().direct_esdt(
            &listing.seller,
            &listing.token_id,
            listing.nonce,
            &BigUint::from(1u32),
        );
    }

    // ─── Views ───────────────────────────────────────────────

    #[view(getListing)]
    fn get_listing(&self, listing_id: u64) -> OptionalValue<Listing<Self::Api>> {
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

    #[view(getOwner)]
    fn get_owner_view(&self) -> ManagedAddress {
        self.owner().get()
    }

    #[view(isPaused)]
    fn is_paused(&self) -> bool {
        self.paused().get()
    }

    // ─── Events ──────────────────────────────────────────────

    #[event("list")]
    fn list_event(&self, #[indexed] id: u64, #[indexed] seller: &ManagedAddress);

    #[event("buy")]
    fn buy_event(&self, #[indexed] id: u64, #[indexed] buyer: &ManagedAddress);

    #[event("claim")]
    fn claim_event(&self, #[indexed] owner: &ManagedAddress, amount: &BigUint);

    // ─── Storage ─────────────────────────────────────────────

    #[view]
    #[storage_mapper("feeBps")]
    fn marketplace_fee_bps(&self) -> SingleValueMapper<u16>;

    #[view]
    #[storage_mapper("listingCount")]
    fn listing_count(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("listings")]
    fn listings(&self, id: u64) -> SingleValueMapper<Listing<Self::Api>>;

    #[view]
    #[storage_mapper("paused")]
    fn paused(&self) -> SingleValueMapper<bool>;

    #[view]
    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("pendingOwner")]
    fn pending_owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[view]
    #[storage_mapper("accumulatedFees")]
    fn accumulated_fees(&self) -> SingleValueMapper<BigUint>;
}
