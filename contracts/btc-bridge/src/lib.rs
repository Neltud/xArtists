#![no_std]

multiversx_sc::imports!();

pub mod modules;

use modules::fees::FeesModule;
use modules::config::ConfigModule;
use modules::bridge_logic::BridgeLogicModule;
use multiversx_sc_modules::pause::PauseModule;

#[multiversx_sc::contract]
pub trait BtcBridge:
    FeesModule +
    ConfigModule +
    BridgeLogicModule +
    PauseModule
{
    #[init]
    fn init(&self) {
        self.bridge_fee_percent().set(50);
        self.max_bridge_amount().set(BigUint::from(100u64));
        self.required_quorum().set(2);
        self.timelock_delay().set(86400);

        // Initialize pause as not paused
        self.set_paused(false);
    }

    // Example of how to use pause in bridge functions
    // (already handled inside BridgeLogicModule via require_not_paused)
}
