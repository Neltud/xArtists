#![no_std]

multiversx_sc_wasm_adapter::allocator!();
multiversx_sc_wasm_adapter::panic_handler!();

multiversx_sc_wasm_adapter::endpoints! {
    treasury_splitter
    (
        init => init
        upgrade => upgrade
        setPaused => set_paused
        transferOwnership => transfer_ownership
        acceptOwnership => accept_ownership
        setSplitBps => set_split_bps
        setDestinations => set_destinations
        receiveAndSplit => receive_and_split
        getTotalSplit => get_total_split
        getOwner => get_owner
        isPaused => is_paused
        mission => mission
        reserve => reserve
        reward => reward
        ops => ops
        missionBps => mission_bps
        reserveBps => reserve_bps
        rewardBps => reward_bps
        opsBps => ops_bps
    )
}

multiversx_sc_wasm_adapter::async_callback_empty! {}
