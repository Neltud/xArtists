#![no_std]

//! xArtists TRO Staking — lock TRO ESDT, track principal per user.
//! No auto-yield on-chain (rewards off-chain / later distributor).

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[multiversx_sc::contract]
pub trait TroStaking {
    #[init]
    fn init(&self, tro_token: TokenIdentifier) {
        require!(!tro_token.is_empty(), "empty token");
        let caller = self.blockchain().get_caller();
        self.owner().set(&caller);
        self.paused().set(false);
        self.tro_token().set(&tro_token);
        self.total_staked().set(BigUint::zero());
    }

    #[endpoint(upgrade)]
    fn upgrade(&self) {
        self.require_owner();
    }

    fn require_owner(&self) {
        require!(
            self.blockchain().get_caller() == self.owner().get(),
            "only owner"
        );
    }

    #[endpoint(setPaused)]
    fn set_paused(&self, value: bool) {
        self.require_owner();
        self.paused().set(value);
    }

    #[payable("*")]
    #[endpoint(stake)]
    fn stake(&self) {
        require!(!self.paused().get(), "paused");
        let payment = self.call_value().single_esdt();
        require!(payment.token_nonce == 0, "fungible only");
        require!(
            payment.token_identifier == self.tro_token().get(),
            "wrong token"
        );
        require!(payment.amount > 0, "zero amount");

        let caller = self.blockchain().get_caller();
        self.user_stake(&caller)
            .update(|b| *b += &payment.amount);
        self.total_staked()
            .update(|t| *t += &payment.amount);
        self.stake_event(&caller, &payment.amount);
    }

    #[endpoint(unstake)]
    fn unstake(&self, amount: BigUint) {
        require!(!self.paused().get(), "paused");
        require!(amount > 0, "zero amount");
        let caller = self.blockchain().get_caller();
        let staked = self.user_stake(&caller).get();
        require!(staked >= amount, "insufficient stake");

        self.user_stake(&caller).set(&(&staked - &amount));
        self.total_staked().update(|t| *t -= &amount);

        let token = self.tro_token().get();
        self.send().direct_esdt(&caller, &token, 0, &amount);
        self.unstake_event(&caller, &amount);
    }

    #[view(getUserStake)]
    #[storage_mapper("user_stake")]
    fn user_stake(&self, user: &ManagedAddress) -> SingleValueMapper<BigUint>;

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
}
