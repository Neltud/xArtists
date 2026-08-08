#![no_std]

//! RWA Escrow Bridge — lock EGLD from protocol/user for physical / phygital purchase.
//! Linked to off-chain trade_id (LIA TradeSettled → Guardian → openEscrow).
//! Security: pause, CEI, storage owner + 2-step transferOwnership, deadline refund.
//! Not a custody vault for user trading capital; Mission/ops or user pays explicitly.

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

const MAX_TRADE_ID_LEN: usize = 64;
const MAX_META_HASH_LEN: usize = 64;

#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct Escrow<M: ManagedTypeApi> {
    pub trade_id: ManagedBuffer<M>,
    pub payer: ManagedAddress<M>,
    pub seller: ManagedAddress<M>,
    pub amount: BigUint<M>,
    pub meta_hash: ManagedBuffer<M>,
    pub deadline: u64,
    pub status: u8, // 0=Open 1=Released 2=Refunded 3=Cancelled
}

#[multiversx_sc::contract]
pub trait RwaEscrowBridge {
    #[init]
    fn init(&self) {
        self.paused().set(false);
        self.last_id().set(0u64);
        let caller = self.blockchain().get_caller();
        self.owner().set(&caller);
        self.pending_owner().clear();
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

    /// Lock EGLD for RWA / physical purchase tied to trade_id (unique).
    #[payable("EGLD")]
    #[endpoint(openEscrow)]
    fn open_escrow(
        &self,
        trade_id: ManagedBuffer,
        seller: ManagedAddress,
        meta_hash: ManagedBuffer,
        deadline: u64,
    ) {
        require!(!self.paused().get(), "paused");
        require!(
            trade_id.len() > 0 && trade_id.len() <= MAX_TRADE_ID_LEN,
            "invalid trade_id"
        );
        require!(
            meta_hash.len() > 0 && meta_hash.len() <= MAX_META_HASH_LEN,
            "invalid meta_hash"
        );
        require!(!seller.is_zero(), "zero seller");
        require!(
            deadline > self.blockchain().get_block_timestamp(),
            "deadline"
        );
        require!(
            self.trade_escrow_id(&trade_id).is_empty(),
            "trade already escrowed"
        );

        let payment = self.call_value().egld_value().clone_value();
        require!(payment > 0, "zero payment");

        let id = self.last_id().get() + 1;
        let payer = self.blockchain().get_caller();

        // CEI: write state before transfers (no outbound on open)
        self.last_id().set(id);
        let esc = Escrow {
            trade_id: trade_id.clone(),
            payer: payer.clone(),
            seller: seller.clone(),
            amount: payment.clone(),
            meta_hash,
            deadline,
            status: 0u8,
        };
        self.escrows(id).set(&esc);
        self.trade_escrow_id(&trade_id).set(id);

        self.open_event(id, &trade_id, &payer, &seller, &payment, deadline);
    }

    /// Release to seller after delivery proof (payer or owner).
    #[endpoint(release)]
    fn release(&self, id: u64) {
        require!(!self.paused().get(), "paused");
        require!(!self.escrows(id).is_empty(), "not found");
        let mut esc = self.escrows(id).get();
        require!(esc.status == 0u8, "not open");

        let caller = self.blockchain().get_caller();
        require!(
            caller == esc.payer || caller == self.owner().get(),
            "not authorized"
        );

        // CEI
        esc.status = 1u8;
        self.escrows(id).set(&esc);
        let amount = esc.amount.clone();
        let seller = esc.seller.clone();
        self.send().direct_egld(&seller, &amount);
        self.release_event(id, &seller, &amount);
    }

    /// Refund payer after deadline, or owner anytime while open.
    #[endpoint(refund)]
    fn refund(&self, id: u64) {
        require!(!self.paused().get(), "paused");
        require!(!self.escrows(id).is_empty(), "not found");
        let mut esc = self.escrows(id).get();
        require!(esc.status == 0u8, "not open");

        let now = self.blockchain().get_block_timestamp();
        let caller = self.blockchain().get_caller();
        let is_owner = caller == self.owner().get();
        require!(now >= esc.deadline || is_owner, "too early");

        esc.status = 2u8;
        self.escrows(id).set(&esc);
        let amount = esc.amount.clone();
        let payer = esc.payer.clone();
        self.send().direct_egld(&payer, &amount);
        self.refund_event(id, &payer, &amount);
    }

    #[endpoint(cancelByOwner)]
    fn cancel_by_owner(&self, id: u64) {
        self.require_owner();
        require!(!self.escrows(id).is_empty(), "not found");
        let mut esc = self.escrows(id).get();
        require!(esc.status == 0u8, "not open");
        esc.status = 3u8;
        self.escrows(id).set(&esc);
        let amount = esc.amount.clone();
        let payer = esc.payer.clone();
        self.send().direct_egld(&payer, &amount);
        self.refund_event(id, &payer, &amount);
    }

    #[view(getEscrow)]
    fn get_escrow(&self, id: u64) -> OptionalValue<Escrow<Self::Api>> {
        if self.escrows(id).is_empty() {
            OptionalValue::None
        } else {
            OptionalValue::Some(self.escrows(id).get())
        }
    }

    #[view(getEscrowIdByTrade)]
    fn get_escrow_id_by_trade(&self, trade_id: ManagedBuffer) -> OptionalValue<u64> {
        if self.trade_escrow_id(&trade_id).is_empty() {
            OptionalValue::None
        } else {
            OptionalValue::Some(self.trade_escrow_id(&trade_id).get())
        }
    }

    #[view(getOwner)]
    fn get_owner_view(&self) -> ManagedAddress {
        self.owner().get()
    }

    #[view(isPaused)]
    fn is_paused(&self) -> bool {
        self.paused().get()
    }

    #[event("open")]
    fn open_event(
        &self,
        #[indexed] id: u64,
        #[indexed] trade_id: &ManagedBuffer,
        #[indexed] payer: &ManagedAddress,
        #[indexed] seller: &ManagedAddress,
        amount: &BigUint,
        deadline: u64,
    );

    #[event("release")]
    fn release_event(
        &self,
        #[indexed] id: u64,
        #[indexed] seller: &ManagedAddress,
        amount: &BigUint,
    );

    #[event("refund")]
    fn refund_event(
        &self,
        #[indexed] id: u64,
        #[indexed] payer: &ManagedAddress,
        amount: &BigUint,
    );

    #[view]
    #[storage_mapper("paused")]
    fn paused(&self) -> SingleValueMapper<bool>;

    #[view]
    #[storage_mapper("lastId")]
    fn last_id(&self) -> SingleValueMapper<u64>;

    #[view]
    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("pendingOwner")]
    fn pending_owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("escrows")]
    fn escrows(&self, id: u64) -> SingleValueMapper<Escrow<Self::Api>>;

    #[storage_mapper("tradeEscrowId")]
    fn trade_escrow_id(&self, trade_id: &ManagedBuffer) -> SingleValueMapper<u64>;
}
