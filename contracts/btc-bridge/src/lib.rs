#![no_std]

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

use multiversx_sc_modules::pause::PauseModule;

#[multiversx_sc::contract]
pub trait BtcBridge: PauseModule {
    #[init]
    fn init(&self) {
        self.owner().set(self.blockchain().get_caller());
        self.bridge_fee_percent().set(50);
        self.max_bridge_amount().set(BigUint::from(100u64));
        self.required_quorum().set(2);
        self.timelock_delay().set(86400);
    }

    #[storage_mapper("bridgeFeePercent")]
    fn bridge_fee_percent(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("maxBridgeAmount")]
    fn max_bridge_amount(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("requiredQuorum")]
    fn required_quorum(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("timelockDelay")]
    fn timelock_delay(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("relayerPubKeys")]
    fn relayer_pub_keys(&self) -> VecMapper<ManagedBuffer>;

    #[storage_mapper("sbtcBalance")]
    fn sbtc_balance(&self, address: &ManagedAddress) -> SingleValueMapper<BigUint>;

    #[storage_mapper("usedNonces")]
    fn used_nonces(&self) -> SetMapper<u64>;

    #[only_owner]
    #[endpoint(setTimelockDelay)]
    fn set_timelock_delay(&self, delay_seconds: u64) {
        require!(delay_seconds >= 3600, "Minimum 1 hour");
        self.timelock_delay().set(delay_seconds);
    }

    #[only_owner]
    #[endpoint(setRequiredQuorum)]
    fn set_required_quorum(&self, quorum: u64) {
        require!(quorum > 0 && quorum <= self.relayer_pub_keys().len() as u64, "Invalid quorum");
        self.required_quorum().set(quorum);
    }

    #[only_owner]
    #[endpoint(addRelayer)]
    fn add_relayer(&self, pub_key: ManagedBuffer) {
        self.relayer_pub_keys().push(&pub_key);
    }

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
        require!(btc_amount > 0 && btc_amount <= self.max_bridge_amount().get(), "Invalid amount");
        require!(!self.used_nonces().contains(&nonce), "Nonce already used");

        let valid = self.verify_quorum_signatures(&signatures, &btc_amount, &user_address, nonce);
        require!(valid >= self.required_quorum().get(), "Quorum not reached");

        let fee = &btc_amount * self.bridge_fee_percent().get() / 10000u64;
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
        let mut valid = 0u64;
        let mut message = ManagedBuffer::new();
        message.append(amount.to_bytes_be().as_slice());
        message.append(user.as_managed_buffer().as_slice());
        message.append(&nonce.to_be_bytes());

        for sig in signatures.iter() {
            for i in 0..self.relayer_pub_keys().len() {
                if self.crypto().verify_ed25519(&sig, &message, &self.relayer_pub_keys().get(i)) {
                    valid += 1;
                    break;
                }
            }
        }
        valid
    }

    #[event("bridge")]
    fn bridge_event(&self, user: &ManagedAddress, amount: &BigUint, fee: &BigUint);
}