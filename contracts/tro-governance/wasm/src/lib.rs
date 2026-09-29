#![no_std]

multiversx_sc_wasm_adapter::allocator!();
multiversx_sc_wasm_adapter::panic_handler!();

multiversx_sc_wasm_adapter::endpoints! {
    tro_governance
    (
        init => init
        setPaused => set_paused
        renounceOwnership => renounce_ownership
        stakeArtPass => stake_art_pass
        unstakeArtPass => unstake_art_pass
        setLpWeight => set_lp_weight
        getVotingPower => get_voting_power
        createProposal => create_proposal
        vote => vote
        closeProposal => close_proposal
        depositTreasury => deposit_treasury
        sweepToLia => sweep_to_lia
        getProposal => proposals
        getProposalCount => proposal_count
        getLpWeight => lp_weight
        getArtpassStaked => artpass_staked
        getTreasury => treasury
        getOwner => owner
        isPaused => paused
    )
}

multiversx_sc_wasm_adapter::async_callback_empty! {}
