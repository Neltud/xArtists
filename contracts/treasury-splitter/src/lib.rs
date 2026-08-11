#![no_std]

//! xArtists Treasury Splitter — receives protocol fees / LIA PnL sink and
//! splits EGLD atomically into Mission / Reserve / Community pools.
//! Default bps: Mission 4000 · Reserve 3000 · Community 3000.
//! Adjustable only by owner (multisig / DAO executor).

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

const BPS_DENOM: u64 = 10_000;
const MAX_BPS: u16 = 10_000;

#[multiversx_sc::contract]
pub trait TreasurySplitter {
    #[init]
    fn init(
        &self,
        mission: ManagedAddress,
        reserve: ManagedAddress,
        community: ManagedAddress,
        mission_bps: u16,
        reserve_bps: u16,
        community_bps: u16,
    ) {
        require!(!mission.is_zero() && !reserve.is_zero() && !community.is_zero(), "zero dest");
        require!(
            (mission_bps as u32) + (reserve_bps as u32) + (community_bps as u32) == BPS_DENOM as u32,
            "bps must sum 10000"
        );
        require!(mission != reserve && mission != community && reserve != community, "dup dest");

        let caller = self.blockchain().get_caller();
        self.owner().set(&caller);
        self.pending_owner().clear();
        self.paused().set(false);

        self.mission().set(&mission);
        self.reserve().set(&reserve);
        self.community().set(&community);
        self.mission_bps().set(mission_bps);
        self.reserve_bps().set(reserve_bps);
        self.community_bps().set(community_bps);
        self.total_split().set(BigUint::zero());
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
    fn set_split_bps(&self, mission_bps: u16, reserve_bps: u16, community_bps: u16) {
        self.require_owner();
        require!(mission_bps <= MAX_BPS && reserve_bps <= MAX_BPS && community_bps <= MAX_BPS, "bps");
        require!(
            (mission_bps as u32) + (reserve_bps as u32) + (community_bps as u32) == BPS_DENOM as u32,
            "bps must sum 10000"
        );
        self.mission_bps().set(mission_bps);
        self.reserve_bps().set(reserve_bps);
        self.community_bps().set(community_bps);
        self.split_updated_event(mission_bps, reserve_bps, community_bps);
    }

    #[endpoint(setDestinations)]
    fn set_destinations(
        &self,
        mission: ManagedAddress,
        reserve: ManagedAddress,
        community: ManagedAddress,
    ) {
        self.require_owner();
        require!(!mission.is_zero() && !reserve.is_zero() && !community.is_zero(), "zero dest");
        require!(mission != reserve && mission != community && reserve != community, "dup dest");
        self.mission().set(&mission);
        self.reserve().set(&reserve);
        self.community().set(&community);
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
        let m_bps = self.mission_bps().get() as u64;
        let c_bps = self.community_bps().get() as u64;

        let to_mission = &amount * m_bps / BPS_DENOM;
        let to_community = &amount * c_bps / BPS_DENOM;
        let to_reserve = &amount - &to_mission - &to_community;

        let mission = self.mission().get();
        let reserve = self.reserve().get();
        let community = self.community().get();

        let prev = self.total_split().get();
        self.total_split().set(&(prev + &amount));

        if to_mission > 0 {
            self.send().direct_egld(&mission, &to_mission);
        }
        if to_reserve > 0 {
            self.send().direct_egld(&reserve, &to_reserve);
        }
        if to_community > 0 {
            self.send().direct_egld(&community, &to_community);
        }

        self.split_event(&amount, &to_mission, &to_reserve, &to_community);
    }

    #[view(getConfig)]
    fn get_config(&self) -> MultiValue6<ManagedAddress, ManagedAddress, ManagedAddress, u16, u16, u16> {
        (
            self.mission().get(),
            self.reserve().get(),
            self.community().get(),
            self.mission_bps().get(),
            self.reserve_bps().get(),
            self.community_bps().get(),
        )
            .into()
    }

    #[view(getTotalSplit)]
    fn get_total_split(&self) -> BigUint {
        self.total_split().get()
    }

    #[view(getOwner)]
    fn get_owner(&self) -> ManagedAddress {
        self.owner().get()
    }

    #[view(isPaused)]
    fn is_paused(&self) -> bool {
        self.paused().get()
    }

    #[event("split")]
    fn split_event(
        &self,
        amount: &BigUint,
        mission: &BigUint,
        reserve: &BigUint,
        community: &BigUint,
    );

    #[event("splitUpdated")]
    fn split_updated_event(&self, mission_bps: u16, reserve_bps: u16, community_bps: u16);

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
    #[storage_mapper("community")]
    fn community(&self) -> SingleValueMapper<ManagedAddress>;

    #[view]
    #[storage_mapper("missionBps")]
    fn mission_bps(&self) -> SingleValueMapper<u16>;

    #[view]
    #[storage_mapper("reserveBps")]
    fn reserve_bps(&self) -> SingleValueMapper<u16>;

    #[view]
    #[storage_mapper("communityBps")]
    fn community_bps(&self) -> SingleValueMapper<u16>;

    #[view]
    #[storage_mapper("totalSplit")]
    fn total_split(&self) -> SingleValueMapper<BigUint>;
}
