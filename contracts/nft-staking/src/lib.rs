#![no_std]

//! xArtists NFT Staking — immutable after owner renounce.
//! No upgrade endpoint. CEI · pause · optional collection allowlist.

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct StakeEntry<M: ManagedTypeApi> {
    pub owner: ManagedAddress<M>,
    pub token: TokenIdentifier<M>,
    pub nonce: u64,
    pub stake_block: u64,
    pub active: bool,
}

#[multiversx_sc::contract]
pub trait NftStaking {
    /// deployer becomes owner until renounceOwnership
    #[init]
    fn init(&self) {
        let caller = self.blockchain().get_caller();
        self.owner().set(&caller);
        self.paused().set(false);
        self.stake_count().set(0u64);
        self.allowlist_enabled().set(false);
    }

    fn require_owner(&self) {
        let owner = self.owner().get();
        require!(!owner.is_zero(), "renounced");
        require!(self.blockchain().get_caller() == owner, "only owner");
    }

    #[endpoint(setPaused)]
    fn set_paused(&self, value: bool) {
        self.require_owner();
        self.paused().set(value);
    }

    #[endpoint(setAllowlistEnabled)]
    fn set_allowlist_enabled(&self, value: bool) {
        self.require_owner();
        self.allowlist_enabled().set(value);
    }

    #[endpoint(setCollectionAllowed)]
    fn set_collection_allowed(&self, token: TokenIdentifier, allowed: bool) {
        self.require_owner();
        self.collection_allowed(&token).set(allowed);
    }

    /// Irreversible — no further admin. Pause/allowlist frozen as-is.
    #[endpoint(renounceOwnership)]
    fn renounce_ownership(&self) {
        self.require_owner();
        self.owner().set(&ManagedAddress::zero());
        self.renounced_event();
    }

    #[payable("*")]
    #[endpoint(stakeNft)]
    fn stake_nft(&self) {
        require!(!self.paused().get(), "paused");
        let payment = self.call_value().single_esdt();
        require!(payment.token_nonce > 0, "need NFT nonce");
        require!(payment.amount == 1u64, "amount must be 1");

        if self.allowlist_enabled().get() {
            require!(
                self.collection_allowed(&payment.token_identifier).get(),
                "collection not allowed"
            );
        }

        let caller = self.blockchain().get_caller();
        let id = self.stake_count().update(|c| {
            *c += 1;
            *c
        });
        let block = self.blockchain().get_block_nonce();
        self.stakes(id).set(StakeEntry {
            owner: caller.clone(),
            token: payment.token_identifier.clone(),
            nonce: payment.token_nonce,
            stake_block: block,
            active: true,
        });
        self.user_stake_ids(&caller).insert(id);
        self.stake_event(id, &caller, &payment.token_identifier, payment.token_nonce);
    }

    #[endpoint(unstakeNft)]
    fn unstake_nft(&self, stake_id: u64) {
        require!(!self.paused().get(), "paused");
        require!(!self.stakes(stake_id).is_empty(), "unknown stake");
        let mut entry = self.stakes(stake_id).get();
        require!(entry.active, "inactive");
        let caller = self.blockchain().get_caller();
        require!(entry.owner == caller, "not owner");

        entry.active = false;
        self.stakes(stake_id).set(&entry);
        self.user_stake_ids(&caller).swap_remove(&stake_id);

        self.send().direct_esdt(
            &caller,
            &entry.token,
            entry.nonce,
            &BigUint::from(1u64),
        );
        self.unstake_event(stake_id, &caller);
    }

    #[view(getStakePoints)]
    fn get_stake_points(&self, stake_id: u64) -> u64 {
        if self.stakes(stake_id).is_empty() {
            return 0;
        }
        let e = self.stakes(stake_id).get();
        if !e.active {
            return 0;
        }
        let now = self.blockchain().get_block_nonce();
        if now > e.stake_block {
            now - e.stake_block
        } else {
            0
        }
    }

    #[view(getStake)]
    #[storage_mapper("stakes")]
    fn stakes(&self, id: u64) -> SingleValueMapper<StakeEntry<Self::Api>>;

    #[view(getStakeCount)]
    #[storage_mapper("stake_count")]
    fn stake_count(&self) -> SingleValueMapper<u64>;

    #[view(isPaused)]
    #[storage_mapper("paused")]
    fn paused(&self) -> SingleValueMapper<bool>;

    #[view(getOwner)]
    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[view(isAllowlistEnabled)]
    #[storage_mapper("allowlist_enabled")]
    fn allowlist_enabled(&self) -> SingleValueMapper<bool>;

    #[view(isCollectionAllowed)]
    #[storage_mapper("collection_allowed")]
    fn collection_allowed(&self, token: &TokenIdentifier) -> SingleValueMapper<bool>;

    #[storage_mapper("user_stake_ids")]
    fn user_stake_ids(&self, user: &ManagedAddress) -> UnorderedSetMapper<u64>;

    #[event("stake")]
    fn stake_event(
        &self,
        #[indexed] stake_id: u64,
        #[indexed] owner: &ManagedAddress,
        token: &TokenIdentifier,
        nonce: u64,
    );

    #[event("unstake")]
    fn unstake_event(&self, #[indexed] stake_id: u64, #[indexed] owner: &ManagedAddress);

    #[event("renounced")]
    fn renounced_event(&self);
}
