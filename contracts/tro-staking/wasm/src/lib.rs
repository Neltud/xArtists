#![no_std]

multiversx_sc_wasm_adapter::allocator!();
multiversx_sc_wasm_adapter::panic_handler!();

multiversx_sc_wasm_adapter::endpoints! {
    tro_staking
    (
        init => init
        setPaused => set_paused
        renounceOwnership => renounce_ownership
        stake => stake
        unstake => unstake
        getStaked => staked
        getTotalStaked => total_staked
        getTroToken => tro_token
        isPaused => paused
        getOwner => owner
    )
}

multiversx_sc_wasm_adapter::async_callback_empty! {}
