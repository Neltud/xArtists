#![no_std]

multiversx_sc_wasm_adapter::allocator!();
multiversx_sc_wasm_adapter::panic_handler!();

multiversx_sc_wasm_adapter::endpoints! {
    nft_staking
    (
        init => init
        setPaused => set_paused
        setAllowlistEnabled => set_allowlist_enabled
        setCollectionAllowed => set_collection_allowed
        renounceOwnership => renounce_ownership
        stakeNft => stake_nft
        unstakeNft => unstake_nft
        getStakePoints => get_stake_points
        getStake => stakes
        getStakeCount => stake_count
        isPaused => paused
        getOwner => owner
        isAllowlistEnabled => allowlist_enabled
    )
}

multiversx_sc_wasm_adapter::async_callback_empty! {}
