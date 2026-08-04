#![no_std]

//! Agent stake escrow — user locks EGLD as starting funds for a purchased agent.
//! Isolated from LIA protocol book. Owner withdraws principal+equity accounting off-chain mirror.
//!
//! Endpoints:
//!   openStake(agent_id) payable EGLD
//!   closeStake(stake_id) — returns locked EGLD to owner
//!   setAgentLive(stake_id, bool) — flag only; does not move funds
//!
//! Security: CEI, pause, owner admin, agent_id length cap.

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

const MAX_AGENT_ID_LEN: usize = 64;

#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct StakeInfo<M: ManagedTypeApi> {
    pub owner: ManagedAddress<M>,
    pub agent_id: ManagedBuffer<M>,
    pub principal: BigUint<M>,
    pub active: bool,
    pub agent_live: bool,
}

#[multiversx_sc::contract]
pub trait AgentStakeEscrow {
    #[init]
    fn init(&self) {
        self.stake_count().set(0u64);
        self.paused().set(false);
        let caller = self.blockchain().get_caller();
        self.owner().set(&caller);
    }

    #[endpoint(upgrade)]
    fn upgrade(&self) {
        self.require_owner();
    }

    fn require_owner(&self) {
        require!(
            self.blockchain().get_caller() == self.owner().get(),
            "only owner"
        );
    }

    #[endpoint(setPaused)]
    fn set_paused(&self, value: bool) {
        self.require_owner();
        self.paused().set(value);
    }

    #[payable("EGLD")]
    #[endpoint(openStake)]
    fn open_stake(&self, agent_id: ManagedBuffer) {
        require!(!self.paused().get(), "paused");
        require!(
            agent_id.len() > 0 && agent_id.len() <= MAX_AGENT_ID_LEN,
            "invalid agent_id"
        );
        let payment = self.call_value().egld_value().clone_value();
        require!(payment > 0, "zero payment");

        let owner = self.blockchain().get_caller();
        let id = self.stake_count().get() + 1;
        self.stake_count().set(id);
        self.stakes(id).set(StakeInfo {
            owner: owner.clone(),
            agent_id,
            principal: payment,
            active: true,
            agent_live: false,
        });
        self.open_event(id, &owner);
    }

    #[endpoint(setAgentLive)]
    fn set_agent_live(&self, stake_id: u64, live: bool) {
        require!(!self.stakes(stake_id).is_empty(), "not found");
        let mut s = self.stakes(stake_id).get();
        require!(s.active, "inactive");
        require!(s.owner == self.blockchain().get_caller(), "only owner");
        s.agent_live = live;
        self.stakes(stake_id).set(s);
    }

    #[endpoint(closeStake)]
    fn close_stake(&self, stake_id: u64) {
        require!(!self.paused().get(), "paused");
        require!(!self.stakes(stake_id).is_empty(), "not found");
        let mut s = self.stakes(stake_id).get();
        require!(s.active, "inactive");
        let caller = self.blockchain().get_caller();
        require!(s.owner == caller, "only owner");

        let amount = s.principal.clone();
        // CEI
        s.active = false;
        s.agent_live = false;
        s.principal = BigUint::zero();
        self.stakes(stake_id).set(s);

        if amount > 0 {
            self.send().direct_egld(&caller, &amount);
        }
        self.close_event(stake_id, &caller);
    }

    #[view(getStake)]
    fn get_stake(&self, stake_id: u64) -> OptionalValue<StakeInfo<Self::Api>> {
        if self.stakes(stake_id).is_empty() {
            OptionalValue::None
        } else {
            OptionalValue::Some(self.stakes(stake_id).get())
        }
    }

    #[event("openStake")]
    fn open_event(&self, #[indexed] id: u64, #[indexed] owner: &ManagedAddress);

    #[event("closeStake")]
    fn close_event(&self, #[indexed] id: u64, #[indexed] owner: &ManagedAddress);

    #[view]
    #[storage_mapper("stakeCount")]
    fn stake_count(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("stakes")]
    fn stakes(&self, id: u64) -> SingleValueMapper<StakeInfo<Self::Api>>;

    #[view]
    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[view]
    #[storage_mapper("paused")]
    fn paused(&self) -> SingleValueMapper<bool>;
}
