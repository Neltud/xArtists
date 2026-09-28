#![no_std]

//! NFT / SFT Marketplace — list / buy / cancel
//! **Seller receives ≥ 90 %** of list price (fee + royalty ≤ 1000 bps).
//! Offer: NO endpoint (see docs/MARKETPLACE_BID_OFFER.md)

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

/// Protocol fee ceiling (10 %).
const MAX_FEE_BPS: u16 = 1000;
/// Creator royalty ceiling (10 %).
const MAX_ROYALTY_BPS: u16 = 1000;
/// fee + royalty must stay ≤ this so seller receives ≥ 90 %.
const MAX_FEE_PLUS_ROYALTY_BPS: u16 = 1000;
const BPS_DENOM: u64 = 10_000;

#[derive(NestedEncode, NestedDecode, TopEncode, TopDecode, TypeAbi, Clone)]
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
    /// fee_bps = protocol take (recommended 300–500). Seller share = 10000 - fee - royalty.
    #[init]
    fn init(&self, fee_bps: u16) {
        require!(fee_bps <= MAX_FEE_BPS, "fee too high");
        self.marketplace_fee_bps().set(fee_bps);
        self.owner().set(&self.blockchain().get_caller());
        self.accumulated_fees().set(BigUint::zero());
        self.paused().set(false);
        self.listing_count().set(0u64);
    }

    #[upgrade]
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

    /// Escrow 1 NFT or 1 SFT unit. royalty_bps + fee_bps ≤ 1000 → seller ≥ 90 %.
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
            (fee_bps as u32) + (royalty_bps as u32) <= (MAX_FEE_PLUS_ROYALTY_BPS as u32),
            "fee+royalty exceed 10% (seller must get >= 90%)"
        );
        let payment = self.call_value().single_esdt();
        // NFT amount == 1; SFT may list 1 unit at a time (same path)
        require!(payment.amount == BigUint::from(1u32), "send 1 unit (NFT or SFT)");
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
        let payment = self.call_value().egld().clone_value();
        require!(payment >= listing.price, "insufficient payment");

        self.refund_bid_if_any(listing_id);

        let fee_bps = self.marketplace_fee_bps().get() as u64;
        let royalty_bps = listing.royalty_bps as u64;
        require!(
            fee_bps + royalty_bps <= MAX_FEE_PLUS_ROYALTY_BPS as u64,
            "fee+royalty exceed 10% (seller must get >= 90%)"
        );
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

    #[payable("EGLD")]
    #[endpoint(placeBid)]
    fn place_bid(&self, listing_id: u64) {
        require!(!self.paused().get(), "paused");
        require!(!self.listings(listing_id).is_empty(), "listing not found");
        let listing = self.listings(listing_id).get();
        require!(listing.active, "inactive");
        let payment = self.call_value().egld().clone_value();
        require!(payment > 0, "zero bid");
        let prev = self.bids(listing_id).get();
        if !prev.bidder.is_zero() {
            require!(payment > prev.amount, "bid too low");
            self.send().direct_egld(&prev.bidder, &prev.amount);
        }
        let bidder = self.blockchain().get_caller();
        self.bids(listing_id).set(Bid {
            bidder: bidder.clone(),
            amount: payment,
        });
        self.bid_event(listing_id, &bidder);
    }

    #[endpoint(acceptBid)]
    fn accept_bid(&self, listing_id: u64) {
        require!(!self.paused().get(), "paused");
        require!(!self.listings(listing_id).is_empty(), "listing not found");
        let mut listing = self.listings(listing_id).get();
        require!(listing.active, "inactive");
        require!(
            listing.seller == self.blockchain().get_caller(),
            "only seller"
        );
        let bid = self.bids(listing_id).get();
        require!(!bid.bidder.is_zero(), "no bid");
        let price = bid.amount.clone();
        let fee_bps = self.marketplace_fee_bps().get() as u64;
        let royalty_bps = listing.royalty_bps as u64;
        require!(
            fee_bps + royalty_bps <= MAX_FEE_PLUS_ROYALTY_BPS as u64,
            "fee+royalty exceed 10% (seller must get >= 90%)"
        );
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
            &bid.bidder,
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
        self.buy_event(listing_id, &bid.bidder);
    }

    #[endpoint(cancelListing)]
    fn cancel_listing(&self, listing_id: u64) {
        require!(!self.listings(listing_id).is_empty(), "listing not found");
        let mut listing = self.listings(listing_id).get();
        require!(listing.active, "inactive");
        require!(
            listing.seller == self.blockchain().get_caller() || self.blockchain().get_caller() == self.owner().get(),
            "only seller or owner"
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
        self.cancel_event(listing_id);
    }

    fn refund_bid_if_any(&self, listing_id: u64) {
        if self.bids(listing_id).is_empty() {
            return;
        }
        let bid = self.bids(listing_id).get();
        if !bid.bidder.is_zero() && bid.amount > 0 {
            self.send().direct_egld(&bid.bidder, &bid.amount);
        }
        self.bids(listing_id).clear();
    }

    #[view(getFeeBps)]
    fn get_fee_bps(&self) -> u16 {
        self.marketplace_fee_bps().get()
    }

    #[view(getListing)]
    fn get_listing(&self, listing_id: u64) -> Listing<Self::Api> {
        self.listings(listing_id).get()
    }

    #[view(getAccumulatedFees)]
    fn get_accumulated_fees(&self) -> BigUint {
        self.accumulated_fees().get()
    }

    #[view(getSellerShareBps)]
    fn get_seller_share_bps(&self, royalty_bps: u16) -> u16 {
        let fee = self.marketplace_fee_bps().get();
        require!(
            (fee as u32) + (royalty_bps as u32) <= (MAX_FEE_PLUS_ROYALTY_BPS as u32),
            "invalid royalty"
        );
        10_000u16 - fee - royalty_bps
    }

    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("pendingOwner")]
    fn pending_owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("paused")]
    fn paused(&self) -> SingleValueMapper<bool>;

    #[storage_mapper("feeBps")]
    fn marketplace_fee_bps(&self) -> SingleValueMapper<u16>;

    #[storage_mapper("listingCount")]
    fn listing_count(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("listings")]
    fn listings(&self, id: u64) -> SingleValueMapper<Listing<Self::Api>>;

    #[storage_mapper("bids")]
    fn bids(&self, id: u64) -> SingleValueMapper<Bid<Self::Api>>;

    #[storage_mapper("accumulatedFees")]
    fn accumulated_fees(&self) -> SingleValueMapper<BigUint>;

    #[event("list")]
    fn list_event(&self, #[indexed] id: u64, #[indexed] seller: &ManagedAddress);

    #[event("buy")]
    fn buy_event(&self, #[indexed] id: u64, #[indexed] buyer: &ManagedAddress);

    #[event("cancel")]
    fn cancel_event(&self, #[indexed] id: u64);

    #[event("bid")]
    fn bid_event(&self, #[indexed] id: u64, #[indexed] bidder: &ManagedAddress);

    #[event("claim")]
    fn claim_event(&self, #[indexed] to: &ManagedAddress, amount: &BigUint);
}

#[derive(NestedEncode, NestedDecode, TopEncode, TopDecode, TypeAbi, Clone, Default)]
pub struct Bid<M: ManagedTypeApi> {
    pub bidder: ManagedAddress<M>,
    pub amount: BigUint<M>,
}
