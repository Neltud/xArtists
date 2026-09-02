#![no_std]

//! xArtists Treasury Splitter — 40/30/20/10 Mission/Reserve/Reward/Ops.
//! receiveAndSplit(EGLD) atomic. setSplitBps sum=10000 owner (multisig/DAO).
//! Dust → ops. Pause + 2-step ownership.

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

const BPS_DENOM: u64 = 10_000;

#[multiversx_sc::contract]
pub trait TreasurySplitter {
    #[init]
    fn init(
        &self,
        mission: ManagedAddress,
        reserve: ManagedAddress,
        reward: ManagedAddress,
        ops: ManagedAddress,
        mission_bps: u16,
        reserve_bps: u16,
        reward_bps: u16,
        ops_bps: u16,
    ) {
        require!(!mission.is_zero() && !reserve.is_zero() && !reward.is_zero() && !ops.is_zero(), "zero dest");
        require!(
            (mission_bps as u32) + (reserve_bps as u32) + (reward_bps as u32) + (ops_bps as u32)
                == BPS_DENOM as u32,
            "bps must sum 10000"
        );

        let caller = self.blockchain().get_caller();
        self.owner().set(&caller);
        self.pending_owner().clear();
        self.paused().set(false);

        self.mission().set(&mission);
        self.reserve().set(&reserve);
        self.reward().set(&reward);
        self.ops().set(&ops);
        self.mission_bps().set(mission_bps);
        self.reserve_bps().set(reserve_bps);
        self.reward_bps().set(reward_bps);
        self.ops_bps().set(ops_bps);
        self.total_split().set(BigUint::zero());
    }

    #[endpoint(upgrade)]
    fn upgrade(&self) { self.require_owner(); }

    fn require_owner(&self) {
        require!(self.blockchain().get_caller() == self.owner().get(), "only owner");
    }

    #[endpoint(setPaused)]
    fn set_paused(&self, value: bool) {
        self.require_owner();
        self.paused().set(value);
    }

    #[endpoint(transferOwnership)]
    fn transfer_ownership(&self, new_owner: ManagedAddress) {
        self.require_owner();
        require!(!new_owner.is_zero(), "zero address");
        require!(new_owner != self.owner().get(), "same owner");
        self.pending_owner().set(&new_owner);
    }

    #[endpoint(acceptOwnership)]
    fn accept_ownership(&self) {
        let caller = self.blockchain().get_caller();
        require!(!self.pending_owner().is_empty(), "no pending owner");
        require!(caller == self.pending_owner().get(), "not pending owner");
        self.owner().set(&caller);
        self.pending_owner().clear();
    }

    #[endpoint(setSplitBps)]
    fn set_split_bps(&self, mission_bps: u16, reserve_bps: u16, reward_bps: u16, ops_bps: u16) {
        self.require_owner();
        require!(
            (mission_bps as u32) + (reserve_bps as u32) + (reward_bps as u32) + (ops_bps as u32)
                == BPS_DENOM as u32,
            "bps must sum 10000"
        );
        self.mission_bps().set(mission_bps);
        self.reserve_bps().set(reserve_bps);
        self.reward_bps().set(reward_bps);
        self.ops_bps().set(ops_bps);
    }

    #[endpoint(setDestinations)]
    fn set_destinations(
        &self,
        mission: ManagedAddress,
        reserve: ManagedAddress,
        reward: ManagedAddress,
        ops: ManagedAddress,
    ) {
        self.require_owner();
        require!(!mission.is_zero() && !reserve.is_zero() && !reward.is_zero() && !ops.is_zero(), "zero dest");
        self.mission().set(&mission);
        self.reserve().set(&reserve);
        self.reward().set(&reward);
        self.ops().set(&ops);
    }

    #[payable("EGLD")]
    #[endpoint(receiveAndSplit)]
    fn receive_and_split(&self) {
        require!(!self.paused().get(), "paused");
        let payment = self.call_value().egld_value().clone_value();
        require!(payment > 0, "zero payment");
        self.split_internal(payment);
    }

    fn split_internal(&self, amount: BigUint) {
        let m = self.mission_bps().get() as u64;
        let r = self.reserve_bps().get() as u64;
        let w = self.reward_bps().get() as u64;

        let to_mission = &amount * m / BPS_DENOM;
        let to_reserve = &amount * r / BPS_DENOM;
        let to_reward = &amount * w / BPS_DENOM;
        let to_ops = &amount - &to_mission - &to_reserve - &to_reward;

        let prev = self.total_split().get();
        self.total_split().set(&(prev + &amount));

        if to_mission > 0 { self.send().direct_egld(&self.mission().get(), &to_mission); }
        if to_reserve > 0 { self.send().direct_egld(&self.reserve().get(), &to_reserve); }
        if to_reward > 0 { self.send().direct_egld(&self.reward().get(), &to_reward); }
        if to_ops > 0 { self.send().direct_egld(&self.ops().get(), &to_ops); }

        self.split_event(&amount, &to_mission, &to_reserve, &to_reward, &to_ops);
    }

    #[view(getTotalSplit)]
    fn get_total_split(&self) -> BigUint { self.total_split().get() }

    #[view(getOwner)]
    fn get_owner(&self) -> ManagedAddress { self.owner().get() }

    #[view(isPaused)]
    fn is_paused(&self) -> bool { self.paused().get() }

    #[event("split")]
    fn split_event(&self, amount: &BigUint, mission: &BigUint, reserve: &BigUint, reward: &BigUint, ops: &BigUint);

    #[view]
    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("pendingOwner")]
    fn pending_owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[view]
    #[storage_mapper("paused")]
    fn paused(&self) -> SingleValueMapper<bool>;

    #[view]
    #[storage_mapper("mission")]
    fn mission(&self) -> SingleValueMapper<ManagedAddress>;

    #[view]
    #[storage_mapper("reserve")]
    fn reserve(&self) -> SingleValueMapper<ManagedAddress>;

    #[view]
    #[storage_mapper("reward")]
    fn reward(&self) -> SingleValueMapper<ManagedAddress>;

    #[view]
    #[storage_mapper("ops")]
    fn ops(&self) -> SingleValueMapper<ManagedAddress>;

    #[view]
    #[storage_mapper("missionBps")]
    fn mission_bps(&self) -> SingleValueMapper<u16>;

    #[view]
    #[storage_mapper("reserveBps")]
    fn reserve_bps(&self) -> SingleValueMapper<u16>;

    #[view]
    #[storage_mapper("rewardBps")]
    fn reward_bps(&self) -> SingleValueMapper<u16>;

    #[view]
    #[storage_mapper("opsBps")]
    fn ops_bps(&self) -> SingleValueMapper<u16>;

    #[view]
    #[storage_mapper("totalSplit")]
    fn total_split(&self) -> SingleValueMapper<BigUint>;
}
