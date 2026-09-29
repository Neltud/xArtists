#![no_std]

multiversx_sc_wasm_adapter::allocator!();
multiversx_sc_wasm_adapter::panic_handler!();

multiversx_sc_wasm_adapter::endpoints! {
    agent_stake_escrow
    (
        init => init
        upgrade => upgrade
        setPaused => set_paused
        openStake => open_stake
        setAgentLive => set_agent_live
        closeStake => close_stake
        getStake => get_stake
        stakeCount => stake_count
        getOwner => owner
        isPaused => paused
    )
}

multiversx_sc_wasm_adapter::async_callback_empty! {}
