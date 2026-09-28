#![no_std]

multiversx_sc_wasm_adapter::allocator!();
multiversx_sc_wasm_adapter::panic_handler!();

multiversx_sc_wasm_adapter::endpoints! {
    nft_marketplace
    (
        init => init
        upgrade => upgrade
        setPaused => set_paused
        setFeeBps => set_fee_bps
        transferOwnership => transfer_ownership
        acceptOwnership => accept_ownership
        claimFees => claim_fees
        listNft => list_nft
        buyNft => buy_nft
        placeBid => place_bid
        acceptBid => accept_bid
        withdrawBid => withdraw_bid
        cancelListing => cancel_listing
        getListing => get_listing
        getBid => get_bid
        getFeeBps => get_fee_bps
        getAccumulatedFees => get_accumulated_fees
        getOwner => get_owner_view
        isPaused => is_paused
    )
}

multiversx_sc_wasm_adapter::async_callback_empty! {}
