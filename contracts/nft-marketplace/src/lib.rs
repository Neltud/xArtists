#![no_std]

//! xArtists NFT Marketplace — MultiversX
//! listNft / buyNft / cancelListing + creator royalty bps + marketplace fee

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

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
        require!(fee_bps <= 1000, "fee too high");
        self.marketplace_fee_bps().set(fee_bps);
        self.listing_count().set(0u64);
        self.paused().set(false);
        self.owner().set(&self.blockchain().get_caller());
    }

    #[upgrade]
    fn upgrade(&self) {}

    #[only_owner]
    #[endpoint(setPaused)]
    fn set_paused(&self, value: bool) {
        self.paused().set(value);
    }

    #[only_owner]
    #[endpoint(setFeeBps)]
    fn set_fee_bps(&self, fee_bps: u16) {
        require!(fee_bps <= 1000, "fee too high");
        self.marketplace_fee_bps().set(fee_bps);
    }

    #[only_owner]
    #[endpoint(claimFees)]
    fn claim_fees(&self) {
        let balance = self.blockchain().get_sc_balance(&EgldOrEsdtTokenIdentifier::egld(), 0);
        require!(balance > 0, "nothing to claim");
        let owner = self.owner().get();
        self.send().direct_egld(&owner, &balance);
    }

    /// Seller transfers NFT to SC via ESDTNFTTransfer then calls list (or use payable NFT in one step).
    /// Simplified: accept NFT payment + price arg.
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
        require!(royalty_bps <= 1000, "royalty too high");

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
        let mut listing = self.listings(listing_id).get();
        require!(listing.active, "inactive");

        let payment = self.call_value().egld_value().clone_value();
        require!(payment >= listing.price, "insufficient payment");

        let fee_bps = self.marketplace_fee_bps().get() as u64;
        let royalty_bps = listing.royalty_bps as u64;

        let fee = &listing.price * fee_bps / 10_000u64;
        let royalty = &listing.price * royalty_bps / 10_000u64;
        let to_seller = &listing.price - &fee - &royalty;

        let buyer = self.blockchain().get_caller();

        // transfer NFT to buyer
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
        // fee remains in SC for claimFees

        listing.active = false;
        self.listings(listing_id).set(listing);
        self.buy_event(listing_id, &buyer);
    }

    #[endpoint(cancelListing)]
    fn cancel_listing(&self, listing_id: u64) {
        let mut listing = self.listings(listing_id).get();
        require!(listing.active, "inactive");
        require!(
            listing.seller == self.blockchain().get_caller(),
            "only seller"
        );
        self.send().direct_esdt(
            &listing.seller,
            &listing.token_id,
            listing.nonce,
            &BigUint::from(1u32),
        );
        listing.active = false;
        self.listings(listing_id).set(listing);
    }

    #[view(getListing)]
    fn get_listing(&self, listing_id: u64) -> OptionalValue<Listing<Self::Api>> {
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
    fn listings(&self, id: u64) -> SingleValueMapper<Listing<Self::Api>>;

    #[view]
    #[storage_mapper("paused")]
    fn paused(&self) -> SingleValueMapper<bool>;

    #[view]
    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;
}
