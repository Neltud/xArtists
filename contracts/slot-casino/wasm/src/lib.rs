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
        spinEgld => spin_egld
        spinEsdt => spin_esdt
        resolveSpin => resolve_spin
        refundSpin => refund_spin
        getPendingSpin => get_pending_spin
        getProgressiveEgld => get_progressive_egld
        getSpinCount => get_spin_count
        getGrandCount => get_grand_count
        getMinBet => get_min_bet
        getProgressiveContribBps => get_progressive_contrib_bps
        getHouseRakeBps => get_house_rake_bps
        getTotalWageredEgld => get_total_wagered_egld
        getTotalPaidEgld => get_total_paid_egld
        isPaused => is_paused
        getOwner => get_owner
    )
}

multiversx_sc_wasm_adapter::async_callback_empty! {}
