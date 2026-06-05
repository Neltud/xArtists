#![no_std]

multiversx_sc::imports!();

#[multiversx_sc::module]
pub trait FeesModule {
    #[storage_mapper("bridgeFeePercent")]
    fn bridge_fee_percent(&self) -> SingleValueMapper<u64>;

    #[only_owner]
    #[endpoint(setBridgeFee)]
    fn set_bridge_fee(&self, fee_percent: u64) {
        require!(fee_percent <= 500, "Maximum fee is 5%");
        self.bridge_fee_percent().set(fee_percent);
    }

    #[view(getBridgeFeePercent)]
    fn get_bridge_fee_percent(&self) -> u64 {
        self.bridge_fee_percent().get()
    }
}
