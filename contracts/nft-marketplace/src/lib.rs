#![no_std]

//! xArtists NFT Marketplace — list/buy/cancel + on-chain Bid
//! Offer: NO endpoint (see docs/MARKETPLACE_BID_OFFER.md)

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

#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct Bid<M: ManagedTypeApi> {
    pub bidder: ManagedAddress<M>,
    pub amount: BigUint<M>,
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

        // Clear any open bid (refund) before buy settles at list price
        self.refund_bid_if_any(listing_id);

        let fee_bps = self.marketplace_fee_bps().get() as u64;
        let royalty_bps = listing.royalty_bps as u64;
        require!(fee_bps + royalty_bps <= BPS_DENOM, "fee+royalty exceed 100%");
        let fee = &listing.price * fee_bps / BPS_DENOM;
        let royalty = &listing.price * royalty_bps / BPS_DENOM;
        let to_seller = &listing.price - &fee - &royalty;
        let buyer = self.blockchain().get_caller();

        listing.active = false;
        self.listings(listing_id).set(listing.clone());
        if fee > 0 {
            self.accumulated_fees().update(|f| *f += &fee);
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

    /// On-chain bid against an active listing. Higher bid refunds previous bidder.
    #[payable("EGLD")]
    #[endpoint(placeBid)]
    fn place_bid(&self, listing_id: u64) {
        require!(!self.paused().get(), "paused");
        require!(!self.listings(listing_id).is_empty(), "listing not found");
        let listing = self.listings(listing_id).get();
        require!(listing.active, "inactive");

        let payment = self.call_value().egld_value().clone_value();
        require!(payment > 0, "bid > 0");

        let min_required = if self.bids(listing_id).is_empty() {
            listing.price.clone()
        } else {
            let cur = self.bids(listing_id).get();
            &cur.amount + &BigUint::from(1u32) // strictly higher
        };
        require!(payment >= min_required, "bid too low");

        // Refund previous highest bidder first (CEI-ish: state after refund prep)
        self.refund_bid_if_any(listing_id);

        let bidder = self.blockchain().get_caller();
        self.bids(listing_id).set(Bid {
            bidder: bidder.clone(),
            amount: payment.clone(),
        });
        self.bid_event(listing_id, &bidder, &payment);
    }

    /// Seller accepts highest bid — settles like buy at bid amount.
    #[endpoint(acceptBid)]
    fn accept_bid(&self, listing_id: u64) {
        require!(!self.paused().get(), "paused");
        require!(!self.listings(listing_id).is_empty(), "listing not found");
        require!(!self.bids(listing_id).is_empty(), "no bid");

        let mut listing = self.listings(listing_id).get();
        require!(listing.active, "inactive");
        require!(
            listing.seller == self.blockchain().get_caller(),
            "only seller"
        );

        let bid = self.bids(listing_id).get();
        let price = bid.amount.clone();
        let buyer = bid.bidder.clone();

        let fee_bps = self.marketplace_fee_bps().get() as u64;
        let royalty_bps = listing.royalty_bps as u64;
        require!(fee_bps + royalty_bps <= BPS_DENOM, "fee+royalty exceed 100%");
        let fee = &price * fee_bps / BPS_DENOM;
        let royalty = &price * royalty_bps / BPS_DENOM;
        let to_seller = &price - &fee - &royalty;

        listing.active = false;
        self.listings(listing_id).set(listing.clone());
        self.bids(listing_id).clear();

        if fee > 0 {
            self.accumulated_fees().update(|f| *f += &fee);
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
        self.accept_bid_event(listing_id, &buyer, &price);
    }

    /// Bidder withdraws if seller has not accepted (and is current bidder).
    #[endpoint(withdrawBid)]
    fn withdraw_bid(&self, listing_id: u64) {
        require!(!self.bids(listing_id).is_empty(), "no bid");
        let bid = self.bids(listing_id).get();
        require!(
            bid.bidder == self.blockchain().get_caller(),
            "only bidder"
        );
        self.bids(listing_id).clear();
        self.send().direct_egld(&bid.bidder, &bid.amount);
        self.withdraw_bid_event(listing_id, &bid.bidder);
    }

    fn refund_bid_if_any(&self, listing_id: u64) {
        if self.bids(listing_id).is_empty() {
            return;
        }
        let prev = self.bids(listing_id).get();
        self.bids(listing_id).clear();
        if prev.amount > 0 {
            self.send().direct_egld(&prev.bidder, &prev.amount);
        }
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
        self.refund_bid_if_any(listing_id);
        listing.active = false;
        self.listings(listing_id).set(listing.clone());
        self.send().direct_esdt(
            &listing.seller,
            &listing.token_id,
            listing.nonce,
            &BigUint::from(1u32),
        );
    }

    #[view(getListing)]
    fn get_listing(&self, listing_id: u64) -> OptionalValue<Listing<Self::Api>> {
        if self.listings(listing_id).is_empty() {
            OptionalValue::None
        } else {
            OptionalValue::Some(self.listings(listing_id).get())
        }
    }

    #[view(getBid)]
    fn get_bid(&self, listing_id: u64) -> OptionalValue<Bid<Self::Api>> {
        if self.bids(listing_id).is_empty() {
            OptionalValue::None
        } else {
            OptionalValue::Some(self.bids(listing_id).get())
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

    #[event("list")]
    fn list_event(&self, #[indexed] id: u64, #[indexed] seller: &ManagedAddress);

    #[event("buy")]
    fn buy_event(&self, #[indexed] id: u64, #[indexed] buyer: &ManagedAddress);

    #[event("claim")]
    fn claim_event(&self, #[indexed] owner: &ManagedAddress, amount: &BigUint);

    #[event("bid")]
    fn bid_event(
        &self,
        #[indexed] id: u64,
        #[indexed] bidder: &ManagedAddress,
        amount: &BigUint,
    );

    #[event("acceptBid")]
    fn accept_bid_event(
        &self,
        #[indexed] id: u64,
        #[indexed] buyer: &ManagedAddress,
        amount: &BigUint,
    );

    #[event("withdrawBid")]
    fn withdraw_bid_event(&self, #[indexed] id: u64, #[indexed] bidder: &ManagedAddress);

    #[view]
    #[storage_mapper("feeBps")]
    fn marketplace_fee_bps(&self) -> SingleValueMapper<u16>;

    #[view]
    #[storage_mapper("listingCount")]
    fn listing_count(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("listings")]
    fn listings(&self, id: u64) -> SingleValueMapper<Listing<Self::Api>>;

    #[storage_mapper("bids")]
    fn bids(&self, id: u64) -> SingleValueMapper<Bid<Self::Api>>;

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
