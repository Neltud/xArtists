#![no_std]

multiversx_sc::imports!();

pub mod modules;

use modules::fees::FeesModule;
use modules::config::ConfigModule;

#[multiversx_sc::contract]
pub trait BtcBridge: FeesModule + ConfigModule {
    #[init]
    fn init(&self) {
        self.bridge_fee_percent().set(50);
        self.max_bridge_amount().set(BigUint::from(100u64));
        self.required_quorum().set(2);
        self.timelock_delay().set(86400);
    }
}
