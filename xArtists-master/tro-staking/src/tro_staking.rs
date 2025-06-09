#![no_std]

#[allow(unused_imports)]
use multiversx_sc::imports::*;

pub mod errors;
pub mod proxy;

pub mod admin;
mod events;
pub mod stake;
mod storage;
pub mod views;
pub mod voting;

/// TRO Governance Staking Contract
/// A MultiversX smart contract for TRO token governance through staking.
/// The contract allows users to stake both TRO tokens and TRO LP tokens to participate in governance decisions.
/// 
/// Key features:
/// - Allows staking of TRO and whitelisted LP tokens
/// - Governance proposal voting system
/// - LP token voting power conversion
/// - Proposal lifecycle management
#[multiversx_sc::contract]
pub trait TroStaking:
    storage::StorageModule
    + stake::StakeModule
    + admin::AdminModule
    + voting::VotingModule
    + events::EventsModule
    + views::ViewsModule
{
    #[init]
    fn init(&self, tro_token_identifier: TokenIdentifier) {
        self.tro_token_identifier().set(tro_token_identifier);
        self.last_proposal_id().set(0);
    }

    /// Allows users to stake TRO and whitelisted LP tokens
    /// Process:
    /// 1. User initiates stake transaction with TRO/LP tokens
    /// 2. Contract verifies token is either TRO or whitelisted LP
    /// 3. Updates user's stake balance for the specific token
    /// 4. Emits stake event
    #[payable("*")]
    #[endpoint(stake)]
    fn stake(&self) {
        let caller = self.blockchain().get_caller();
        let payments = self.call_value().all_esdt_transfers();

        self.process_stake(&caller, &payments);

        self.emit_stake_event(&caller, &payments);
    }

    /// Allows users to unstake their tokens
    /// Process:
    /// 1. User requests unstake with token types and amounts
    /// 2. Contract verifies no active proposals exist
    /// 3. Verifies user has sufficient stake of requested tokens
    /// 4. Reduces user's stake balance for specified tokens
    /// 5. Transfers tokens back to user
    /// 6. Emits unstake event
    #[endpoint(unstake)]
    fn unstake(&self, request: MultiValueEncoded<MultiValue2<TokenIdentifier, BigUint>>) {
        let caller = self.blockchain().get_caller();
        let payments = self.process_unstake(&caller, request);

        // Security: prevent unstake if there is an ongoing proposal
        self.require_no_proposal_ongoing();

        self.send().direct_multi(&caller, &payments);

        self.emit_unstake_event(&caller, &payments);
    }

    #[upgrade]
    fn upgrade(&self) {}
}
