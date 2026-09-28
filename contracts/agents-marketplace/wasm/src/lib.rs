#![no_std]

multiversx_sc_wasm_adapter::allocator!();
multiversx_sc_wasm_adapter::panic_handler!();

multiversx_sc_wasm_adapter::endpoints! {
    agents_marketplace
    (
        init => init
        upgrade => upgrade
        setPaused => set_paused
        setFeeBps => set_fee_bps
        transferOwnership => transfer_ownership
        acceptOwnership => accept_ownership
        claimFees => claim_fees
        listAgentAction => list_agent_action
        buyAgentAction => buy_agent_action
        cancelListing => cancel_listing
        getListing => get_listing
        getFeeBps => get_fee_bps
        getAccumulatedFees => get_accumulated_fees
        getContractEgldBalance => get_contract_egld_balance
        getOwner => get_owner
        getPendingOwner => get_pending_owner
        isPaused => is_paused
    )
}

multiversx_sc_wasm_adapter::async_callback_empty! {}
