#[allow(unused_imports)]
use multiversx_sc::imports::*;

/// Storage module managing the contract's persistent state
/// Handles token identifiers and user stake balances
#[multiversx_sc::module]
pub trait StorageModule {
    /// Gets the TRO token identifier
    /// This is the main governance token of the protocol
    #[view(getTroTokenIdentifier)]
    #[storage_mapper("tro_token_identifier")]
    fn tro_token_identifier(&self) -> SingleValueMapper<TokenIdentifier>;

    /// Gets the list of whitelisted LP token identifiers
    /// These LP tokens can be staked for additional voting power
    #[view(getWhitelistedLpTokenIdentifiers)]
    #[storage_mapper("whitelisted_lp_token_identifiers")]
    fn whitelisted_lp_token_identifiers(&self) -> SetMapper<TokenIdentifier>;

    /// Gets the stake balance for a specific user and token
    /// Tracks how much of each token type a user has staked
    #[view(getUsersStake)]
    #[storage_mapper("users_stake")]
    fn users_stake(
        &self,
        users_address: &ManagedAddress,
        token_identifier: &TokenIdentifier,
    ) -> SingleValueMapper<BigUint>;
}
