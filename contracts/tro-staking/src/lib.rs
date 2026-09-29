#![no_std]

//! xArtists TRO Staking — lock TRO ESDT. Principal only (no on-chain yield).

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[multiversx_sc::contract]
pub trait TroStaking {
    #[init]
    fn init(&self, tro_token: TokenIdentifier) {
        require!(!tro_token.is_egld() && !tro_token.is_empty(), "empty token");
        let caller = self.blockchain().get_caller();
        self.owner().set(&caller);
        self.paused().set(false);
        self.tro_token().set(&tro_token);
        self.total_staked().set(BigUint::zero());
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

    #[endpoint(renounceOwnership)]
    fn renounce_ownership(&self) {
        self.require_owner();
        self.owner().set(&ManagedAddress::zero());
        self.renounced_event();
    }

    #[payable("*")]
    #[endpoint(stake)]
    fn stake(&self) {
        require!(!self.paused().get(), "paused");
        let payment = self.call_value().single_esdt();
        require!(payment.token_nonce == 0, "fungible only");
        require!(payment.amount > 0, "zero");
        require!(
            payment.token_identifier == self.tro_token().get(),
            "wrong token"
        );
        let caller = self.blockchain().get_caller();
        self.staked(&caller).update(|s| *s += &payment.amount);
        self.total_staked().update(|t| *t += &payment.amount);
        self.stake_event(&caller, &payment.amount);
    }

    #[endpoint(unstake)]
    fn unstake(&self, amount: BigUint) {
        require!(!self.paused().get(), "paused");
        require!(amount > 0, "zero");
        let caller = self.blockchain().get_caller();
        let bal = self.staked(&caller).get();
        require!(bal >= amount, "insufficient");
        self.staked(&caller).set(&(&bal - &amount));
        self.total_staked().update(|t| *t -= &amount);
        let token = self.tro_token().get();
        self.send().direct_esdt(&caller, &token, 0, &amount);
        self.unstake_event(&caller, &amount);
    }

    #[view(getStaked)]
    #[storage_mapper("staked")]
    fn staked(&self, user: &ManagedAddress) -> SingleValueMapper<BigUint>;

    #[view(getTotalStaked)]
    #[storage_mapper("total_staked")]
    fn total_staked(&self) -> SingleValueMapper<BigUint>;

    #[view(getTroToken)]
    #[storage_mapper("tro_token")]
    fn tro_token(&self) -> SingleValueMapper<TokenIdentifier>;

    #[view(isPaused)]
    #[storage_mapper("paused")]
    fn paused(&self) -> SingleValueMapper<bool>;

    #[view(getOwner)]
    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[event("stake")]
    fn stake_event(&self, #[indexed] user: &ManagedAddress, amount: &BigUint);

    #[event("unstake")]
    fn unstake_event(&self, #[indexed] user: &ManagedAddress, amount: &BigUint);

    #[event("renounced")]
    fn renounced_event(&self);
}
