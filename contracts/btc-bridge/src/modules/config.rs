#![no_std]

multiversx_sc::imports!();

#[multiversx_sc::module]
pub trait ConfigModule {
    #[storage_mapper("timelockDelay")]
    fn timelock_delay(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("maxBridgeAmount")]
    fn max_bridge_amount(&self) -> SingleValueMapper<BigUint>;

    #[storage_mapper("requiredQuorum")]
    fn required_quorum(&self) -> SingleValueMapper<u64>;

    #[only_owner]
    #[endpoint(setTimelockDelay)]
    fn set_timelock_delay(&self, delay_seconds: u64) {
        require!(delay_seconds >= 3600, "Minimum 1 hour");
        self.timelock_delay().set(delay_seconds);
    }

    #[only_owner]
    #[endpoint(setMaxBridgeAmount)]
    fn set_max_bridge_amount(&self, max_amount: BigUint) {
        self.max_bridge_amount().set(max_amount);
    }

    #[only_owner]
    #[endpoint(setRequiredQuorum)]
    fn set_required_quorum(&self, quorum: u64) {
        require!(quorum > 0, "Quorum must be at least 1");
        self.required_quorum().set(quorum);
    }
}
