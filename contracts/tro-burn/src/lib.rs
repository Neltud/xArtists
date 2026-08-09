#![no_std]

//! xArtists $TRO burn — ESDTTransfer → local burn.
//! Requires ESDTLocalBurn role on TRO for this SC.

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

#[multiversx_sc::contract]
pub trait TroBurn {
    #[init]
    fn init(&self, tro_token_id: TokenIdentifier) {
        require!(tro_token_id.is_valid_esdt_identifier(), "invalid token");
        self.tro_token_id().set(&tro_token_id);
        self.total_burned().set(BigUint::zero());
        self.paused().set(false);
        let caller = self.blockchain().get_caller();
        self.owner().set(&caller);
    }

    #[upgrade]
    fn upgrade(&self) {
        self.require_owner();
    }

    fn require_owner(&self) {
        require!(
            self.blockchain().get_caller() == self.owner().get(),
            "only owner"
        );
    }

    fn require_not_paused(&self) {
        require!(!self.paused().get(), "paused");
    }

    #[endpoint(pause)]
    fn pause(&self) {
        self.require_owner();
        self.paused().set(true);
    }

    #[endpoint(unpause)]
    fn unpause(&self) {
        self.require_owner();
        self.paused().set(false);
    }

    #[endpoint(setTroTokenId)]
    fn set_tro_token_id(&self, token_id: TokenIdentifier) {
        self.require_owner();
        require!(token_id.is_valid_esdt_identifier(), "invalid token");
        self.tro_token_id().set(&token_id);
    }

    #[payable("*")]
    #[endpoint(burnTro)]
    fn burn_tro(&self) {
        self.require_not_paused();
        let (token_id, _nonce, amount) = self.call_value().single_esdt().into_tuple();
        let expected = self.tro_token_id().get();
        require!(token_id == expected, "only TRO accepted");
        require!(amount > 0, "amount zero");

        self.send().esdt_local_burn(&token_id, 0u64, &amount);

        let mut total = self.total_burned().get();
        total += &amount;
        self.total_burned().set(&total);

        let caller = self.blockchain().get_caller();
        self.burn_event(&caller, &amount, &total);
    }

    #[event("burnTro")]
    fn burn_event(
        &self,
        #[indexed] burner: &ManagedAddress,
        amount: &BigUint,
        total_burned: &BigUint,
    );

    #[view(getTroTokenId)]
    #[storage_mapper("tro_token_id")]
    fn tro_token_id(&self) -> SingleValueMapper<TokenIdentifier>;

    #[view(getTotalBurned)]
    #[storage_mapper("total_burned")]
    fn total_burned(&self) -> SingleValueMapper<BigUint>;

    #[view(isPaused)]
    #[storage_mapper("paused")]
    fn paused(&self) -> SingleValueMapper<bool>;

    #[view(getOwner)]
    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;
}
