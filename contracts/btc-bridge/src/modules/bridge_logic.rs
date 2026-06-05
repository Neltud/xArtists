#![no_std]

multiversx_sc::imports!();

use crate::modules::fees::FeesModule;
use crate::modules::config::ConfigModule;
use multiversx_sc_modules::pause::PauseModule;

#[multiversx_sc::module]
pub trait BridgeLogicModule: FeesModule + ConfigModule + PauseModule {
    #[storage_mapper("sbtcBalance")]
    fn sbtc_balance(&self, address: &ManagedAddress) -> SingleValueMapper<BigUint>;

    #[storage_mapper("usedNonces")]
    fn used_nonces(&self) -> SetMapper<u64>;

    #[payable("EGLD")]
    #[endpoint(bridgeBtcToSbtc)]
    fn bridge_btc_to_sbtc(
        &self,
        btc_amount: BigUint,
        user_address: ManagedAddress,
        signatures: ManagedVec<ManagedBuffer>,
        nonce: u64,
    ) {
        self.require_not_paused(); // From PauseModule

        let max_amount = self.max_bridge_amount().get();
        require!(btc_amount > 0 && btc_amount <= max_amount, "Invalid amount");
        require!(!self.used_nonces().contains(&nonce), "Nonce already used");

        // TODO: Implement real quorum signature verification
        let valid_signatures = 2u64;
        let required = self.required_quorum().get();
        require!(valid_signatures >= required, "Quorum not reached");

        let fee_percent = self.bridge_fee_percent().get();
        let fee = &btc_amount * fee_percent / 10000u64;
        let amount_after_fee = &btc_amount - &fee;

        self.sbtc_balance(&user_address).update(|b| *b += &amount_after_fee);
        self.used_nonces().insert(nonce);

        self.bridge_event(&user_address, &amount_after_fee, &fee);
    }

    #[event("bridge")]
    fn bridge_event(&self, user: &ManagedAddress, amount: &BigUint, fee: &BigUint);
}
