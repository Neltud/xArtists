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

    #[storage_mapper("relayerPubKeys")]
    fn relayer_pub_keys(&self) -> VecMapper<ManagedBuffer>;

    #[payable("EGLD")]
    #[endpoint(bridgeBtcToSbtc)]
    fn bridge_btc_to_sbtc(
        &self,
        btc_amount: BigUint,
        user_address: ManagedAddress,
        signatures: ManagedVec<ManagedBuffer>,
        nonce: u64,
    ) {
        self.require_not_paused();

        let max_amount = self.max_bridge_amount().get();
        require!(btc_amount > 0 && btc_amount <= max_amount, "Invalid amount");
        require!(!self.used_nonces().contains(&nonce), "Nonce already used");

        let valid = self.verify_quorum_signatures(&signatures, &btc_amount, &user_address, nonce);
        let required = self.required_quorum().get();
        require!(valid >= required, "Quorum not reached");

        let fee_percent = self.bridge_fee_percent().get();
        let fee = &btc_amount * fee_percent / 10000u64;
        let amount_after_fee = &btc_amount - &fee;

        self.sbtc_balance(&user_address).update(|b| *b += &amount_after_fee);
        self.used_nonces().insert(nonce);

        self.bridge_event(&user_address, &amount_after_fee, &fee);
    }

    fn verify_quorum_signatures(
        &self,
        signatures: &ManagedVec<ManagedBuffer>,
        amount: &BigUint,
        user: &ManagedAddress,
        nonce: u64,
    ) -> u64 {
        let mut valid_count = 0u64;
        let required = self.required_quorum().get();
        let max_relayers = self.relayer_pub_keys().len() as u64;

        // Gas optimization: limit maximum relayers to check
        require!(max_relayers > 0 && max_relayers <= 20, "Invalid number of relayers");

        let mut message = ManagedBuffer::new();
        message.append(amount.to_bytes_be().as_slice());
        message.append(user.as_managed_buffer().as_slice());
        message.append(&nonce.to_be_bytes());

        for sig in signatures.iter() {
            for i in 0..self.relayer_pub_keys().len() {
                if self.crypto().verify_ed25519(&sig, &message, &self.relayer_pub_keys().get(i)) {
                    valid_count += 1;
                    if valid_count >= required {
                        return valid_count; // Early exit for gas saving
                    }
                    break;
                }
            }
        }
        valid_count
    }

    #[event("bridge")]
    fn bridge_event(&self, user: &ManagedAddress, amount: &BigUint, fee: &BigUint);
}
