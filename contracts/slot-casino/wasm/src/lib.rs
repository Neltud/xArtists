#![no_std]

multiversx_sc_wasm_adapter::allocator!();
multiversx_sc_wasm_adapter::panic_handler!();

multiversx_sc_wasm_adapter::endpoints! {
    slot_casino
    (
        init => init
        upgrade => upgrade
        setPaused => set_paused
        setProgressiveContribBps => set_progressive_contrib_bps
        setHouseRakeBps => set_house_rake_bps
        setMinBet => set_min_bet
        setResolveDelayBlocks => set_resolve_delay_blocks
        setTimeoutBlocks => set_timeout_blocks
        setPaymentTokenAllowed => set_payment_token_allowed
        fundProgressiveEgld => fund_progressive_egld
        fundProgressiveEsdt => fund_progressive_esdt
        transferOwnership => transfer_ownership
        acceptOwnership => accept_ownership
        claimHouseEgld => claim_house_egld
        claimHouseEsdt => claim_house_esdt
        lockSpinEgld => lock_spin_egld
        lockSpinEsdt => lock_spin_esdt
        resolveSpin => resolve_spin
        refundSpin => refund_spin
        getPendingSpin => get_pending_spin_view
        getProgressiveEgld => progressive_egld
        getProgressiveEsdt => progressive_esdt
        getSpinCount => spin_count
        getGrandCount => grand_count
        getMinBet => min_bet
        getProgressiveContribBps => progressive_contrib_bps
        getHouseRakeBps => house_rake_bps
        getResolveDelayBlocks => resolve_delay_blocks
        getTimeoutBlocks => timeout_blocks
        isPaused => paused
        getOwner => owner
        isPaymentTokenAllowed => payment_token_allowed
        getUserPendingCount => user_pending_count
    )
}

multiversx_sc_wasm_adapter::async_callback_empty! {}
