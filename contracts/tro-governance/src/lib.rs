#![no_std]

//! xArtists DAO Vote — voting power = registered LP weight + ArtPass SFT staked.
//! Paper-compatible views; on-chain cast requires stake registration.
//! Fees/tips not held here — treasury = LIA ops address set at init.
//! No upgrade. Renounce optional.

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

const MAX_TITLE: usize = 128;
const ART_PASS_WEIGHT: u64 = 10; // fixed weight units per SFT unit (nonce amount)

#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct Proposal<M: ManagedTypeApi> {
    pub title: ManagedBuffer<M>,
    pub yes: BigUint<M>,
    pub no: BigUint<M>,
    pub open: bool,
    pub end_block: u64,
}

#[multiversx_sc::contract]
pub trait TroGovernance {
    /// treasury = LIA ops (benefits / residual claims only if any EGLD sent)
    #[init]
    fn init(&self, treasury: ManagedAddress) {
        require!(!treasury.is_zero(), "treasury zero");
        let caller = self.blockchain().get_caller();
        self.owner().set(&caller);
        self.treasury().set(&treasury);
        self.paused().set(false);
        self.proposal_count().set(0u64);
    }

    fn require_owner(&self) {
        let o = self.owner().get();
        require!(!o.is_zero(), "renounced");
        require!(self.blockchain().get_caller() == o, "only owner");
    }

    #[endpoint(setPaused)]
    fn set_paused(&self, v: bool) {
        self.require_owner();
        self.paused().set(v);
    }

    #[endpoint(renounceOwnership)]
    fn renounce_ownership(&self) {
        self.require_owner();
        self.owner().set(&ManagedAddress::zero());
    }

    /// Register ArtPass SFT (amount >= 1) — locked until unregister
    #[payable("*")]
    #[endpoint(stakeArtPass)]
    fn stake_art_pass(&self) {
        require!(!self.paused().get(), "paused");
        let p = self.call_value().single_esdt();
        require!(p.token_nonce > 0, "need SFT/NFT");
        require!(p.amount > 0, "zero");
        let caller = self.blockchain().get_caller();
        // one collection slot simplified: accumulate amount per user
        self.artpass_token().set(&p.token_identifier);
        self.artpass_staked(&caller)
            .update(|a| *a += &p.amount);
    }

    #[endpoint(unstakeArtPass)]
    fn unstake_art_pass(&self, amount: BigUint) {
        require!(!self.paused().get(), "paused");
        require!(amount > 0, "zero");
        let caller = self.blockchain().get_caller();
        let st = self.artpass_staked(&caller).get();
        require!(st >= amount, "insufficient");
        self.artpass_staked(&caller).set(&(&st - &amount));
        let token = self.artpass_token().get();
        // return with nonce 0 invalid for NFT — store nonce in mapper
        // Simplified: use last_nonce
        let nonce = self.artpass_nonce(&caller).get();
        require!(nonce > 0, "no nonce");
        self.send().direct_esdt(&caller, &token, nonce, &amount);
    }

    /// LP weight: owner registers observed weight (oracle/ops) OR user self-declares with bond —
    /// Production: use setLpWeight by owner after off-chain LP proof; users cannot inflate.
    #[endpoint(setLpWeight)]
    fn set_lp_weight(&self, user: ManagedAddress, weight: BigUint) {
        self.require_owner();
        self.lp_weight(&user).set(&weight);
    }

    #[view(getVotingPower)]
    fn get_voting_power(&self, user: ManagedAddress) -> BigUint {
        let lp = self.lp_weight(&user).get();
        let art = self.artpass_staked(&user).get();
        let art_w = art * BigUint::from(ART_PASS_WEIGHT);
        lp + art_w
    }

    #[endpoint(createProposal)]
    fn create_proposal(&self, title: ManagedBuffer, duration_blocks: u64) {
        self.require_owner();
        require!(title.len() > 0 && title.len() <= MAX_TITLE, "title");
        require!(duration_blocks > 0, "duration");
        let id = self.proposal_count().update(|c| {
            *c += 1;
            *c
        });
        let end = self.blockchain().get_block_nonce() + duration_blocks;
        self.proposals(id).set(Proposal {
            title,
            yes: BigUint::zero(),
            no: BigUint::zero(),
            open: true,
            end_block: end,
        });
    }

    #[endpoint(vote)]
    fn vote(&self, proposal_id: u64, support: bool) {
        require!(!self.paused().get(), "paused");
        require!(!self.proposals(proposal_id).is_empty(), "unknown");
        let mut p = self.proposals(proposal_id).get();
        require!(p.open, "closed");
        require!(
            self.blockchain().get_block_nonce() <= p.end_block,
            "ended"
        );
        let caller = self.blockchain().get_caller();
        require!(!self.has_voted(proposal_id, &caller).get(), "already voted");
        let power = self.get_voting_power(caller.clone());
        require!(power > 0, "no power");
        if support {
            p.yes += &power;
        } else {
            p.no += &power;
        }
        self.proposals(proposal_id).set(&p);
        self.has_voted(proposal_id, &caller).set(true);
    }

    #[endpoint(closeProposal)]
    fn close_proposal(&self, proposal_id: u64) {
        require!(!self.proposals(proposal_id).is_empty(), "unknown");
        let mut p = self.proposals(proposal_id).get();
        require!(p.open, "closed");
        require!(
            self.blockchain().get_block_nonce() > p.end_block
                || self.blockchain().get_caller() == self.owner().get(),
            "not ended"
        );
        p.open = false;
        self.proposals(proposal_id).set(&p);
    }

    /// Any EGLD sent here can be pulled only to LIA treasury
    #[payable("EGLD")]
    #[endpoint(depositTreasury)]
    fn deposit_treasury(&self) {
        let _ = self.call_value().egld_value();
    }

    #[endpoint(sweepToLia)]
    fn sweep_to_lia(&self) {
        let bal = self.blockchain().get_sc_balance(&EgldOrEsdtTokenIdentifier::egld(), 0);
        require!(bal > 0, "empty");
        let t = self.treasury().get();
        self.send().direct_egld(&t, &bal);
    }

    #[view(getProposal)]
    #[storage_mapper("proposals")]
    fn proposals(&self, id: u64) -> SingleValueMapper<Proposal<Self::Api>>;

    #[view(getProposalCount)]
    #[storage_mapper("proposal_count")]
    fn proposal_count(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("has_voted")]
    fn has_voted(&self, id: u64, user: &ManagedAddress) -> SingleValueMapper<bool>;

    #[view(getLpWeight)]
    #[storage_mapper("lp_weight")]
    fn lp_weight(&self, user: &ManagedAddress) -> SingleValueMapper<BigUint>;

    #[view(getArtpassStaked)]
    #[storage_mapper("artpass_staked")]
    fn artpass_staked(&self, user: &ManagedAddress) -> SingleValueMapper<BigUint>;

    #[storage_mapper("artpass_token")]
    fn artpass_token(&self) -> SingleValueMapper<TokenIdentifier>;

    #[storage_mapper("artpass_nonce")]
    fn artpass_nonce(&self, user: &ManagedAddress) -> SingleValueMapper<u64>;

    #[view(getTreasury)]
    #[storage_mapper("treasury")]
    fn treasury(&self) -> SingleValueMapper<ManagedAddress>;

    #[view(getOwner)]
    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[view(isPaused)]
    #[storage_mapper("paused")]
    fn paused(&self) -> SingleValueMapper<bool>;
}
