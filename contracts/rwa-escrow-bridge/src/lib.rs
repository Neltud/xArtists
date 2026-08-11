#![no_std]

//! RWA Escrow Bridge — lock EGLD for physical / phygital purchase.
//! States: Open → Released | Refunded | Cancelled | Disputed
//! Release: payer confirmReceipt OR attestor submitVerificationProof (NFC/AR hash).
//! Dispute: 7-day cooling; owner resolves. CEI, pause, 2-step ownership.

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

const MAX_TRADE_ID_LEN: usize = 64;
const MAX_HASH_LEN: usize = 64;
const DISPUTE_COOLING_SECS: u64 = 7 * 24 * 3600;

#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, Clone)]
pub struct Escrow<M: ManagedTypeApi> {
    pub trade_id: ManagedBuffer<M>,
    pub payer: ManagedAddress<M>,
    pub seller: ManagedAddress<M>,
    pub amount: BigUint<M>,
    pub meta_hash: ManagedBuffer<M>,
    pub deadline: u64,
    pub status: u8,
    pub dispute_opened_at: u64,
    pub proof_hash: ManagedBuffer<M>,
}

#[multiversx_sc::contract]
pub trait RwaEscrowBridge {
    #[init]
    fn init(&self, attestor: ManagedAddress) {
        self.paused().set(false);
        self.last_id().set(0u64);
        let caller = self.blockchain().get_caller();
        self.owner().set(&caller);
        self.pending_owner().clear();
        require!(!attestor.is_zero(), "zero attestor");
        self.attestor().set(&attestor);
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

    #[endpoint(setAttestor)]
    fn set_attestor(&self, attestor: ManagedAddress) {
        self.require_owner();
        require!(!attestor.is_zero(), "zero attestor");
        self.attestor().set(&attestor);
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
        require!(trade_id.len() > 0 && trade_id.len() <= MAX_TRADE_ID_LEN, "invalid trade_id");
        require!(meta_hash.len() > 0 && meta_hash.len() <= MAX_HASH_LEN, "invalid meta_hash");
        require!(!seller.is_zero(), "zero seller");
        require!(deadline > self.blockchain().get_block_timestamp(), "deadline");
        require!(self.trade_escrow_id(&trade_id).is_empty(), "trade already escrowed");

        let payment = self.call_value().egld_value().clone_value();
        require!(payment > 0, "zero payment");

        let id = self.last_id().get() + 1;
        let payer = self.blockchain().get_caller();

        self.last_id().set(id);
        let esc = Escrow {
            trade_id: trade_id.clone(),
            payer: payer.clone(),
            seller: seller.clone(),
            amount: payment.clone(),
            meta_hash,
            deadline,
            status: 0u8,
            dispute_opened_at: 0u64,
            proof_hash: ManagedBuffer::new(),
        };
        self.escrows(id).set(&esc);
        self.trade_escrow_id(&trade_id).set(id);
        self.open_event(id, &trade_id, &payer, &seller, &payment, deadline);
    }

    #[endpoint(confirmReceipt)]
    fn confirm_receipt(&self, id: u64) {
        require!(!self.paused().get(), "paused");
        require!(!self.escrows(id).is_empty(), "not found");
        let mut esc = self.escrows(id).get();
        require!(esc.status == 0u8, "not open");
        require!(self.blockchain().get_caller() == esc.payer, "only payer");
        self.release_to_seller(id, &mut esc);
    }

    #[endpoint(submitVerificationProof)]
    fn submit_verification_proof(&self, id: u64, proof_hash: ManagedBuffer) {
        require!(!self.paused().get(), "paused");
        require!(!self.escrows(id).is_empty(), "not found");
        let mut esc = self.escrows(id).get();
        require!(esc.status == 0u8, "not open");
        require!(self.blockchain().get_caller() == self.attestor().get(), "only attestor");
        require!(proof_hash.len() > 0 && proof_hash.len() <= MAX_HASH_LEN, "invalid proof");
        esc.proof_hash = proof_hash;
        self.release_to_seller(id, &mut esc);
    }

    fn release_to_seller(&self, id: u64, esc: &mut Escrow<Self::Api>) {
        esc.status = 1u8;
        self.escrows(id).set(esc);
        let amount = esc.amount.clone();
        let seller = esc.seller.clone();
        self.send().direct_egld(&seller, &amount);
        self.release_event(id, &seller, &amount);
    }

    #[endpoint(openDispute)]
    fn open_dispute(&self, id: u64) {
        require!(!self.paused().get(), "paused");
        require!(!self.escrows(id).is_empty(), "not found");
        let mut esc = self.escrows(id).get();
        require!(esc.status == 0u8, "not open");
        let caller = self.blockchain().get_caller();
        require!(caller == esc.payer || caller == esc.seller, "only parties");
        let now = self.blockchain().get_block_timestamp();
        esc.status = 4u8;
        esc.dispute_opened_at = now;
        self.escrows(id).set(&esc);
        self.dispute_event(id, &caller, now);
    }

    #[endpoint(resolveDispute)]
    fn resolve_dispute(&self, id: u64, favor_seller: bool) {
        require!(!self.escrows(id).is_empty(), "not found");
        let mut esc = self.escrows(id).get();
        require!(esc.status == 4u8, "not disputed");
        let caller = self.blockchain().get_caller();
        require!(caller == self.owner().get(), "only owner resolves");

        let amount = esc.amount.clone();
        if favor_seller {
            esc.status = 1u8;
            self.escrows(id).set(&esc);
            let seller = esc.seller.clone();
            self.send().direct_egld(&seller, &amount);
            self.release_event(id, &seller, &amount);
        } else {
            esc.status = 2u8;
            self.escrows(id).set(&esc);
            let payer = esc.payer.clone();
            self.send().direct_egld(&payer, &amount);
            self.refund_event(id, &payer, &amount);
        }
    }

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
        if self.escrows(id).is_empty() { OptionalValue::None } else { OptionalValue::Some(self.escrows(id).get()) }
    }

    #[view(getEscrowIdByTrade)]
    fn get_escrow_id_by_trade(&self, trade_id: ManagedBuffer) -> OptionalValue<u64> {
        if self.trade_escrow_id(&trade_id).is_empty() { OptionalValue::None } else { OptionalValue::Some(self.trade_escrow_id(&trade_id).get()) }
    }

    #[view(getOwner)]
    fn get_owner(&self) -> ManagedAddress { self.owner().get() }

    #[view(getAttestor)]
    fn get_attestor(&self) -> ManagedAddress { self.attestor().get() }

    #[view(isPaused)]
    fn is_paused(&self) -> bool { self.paused().get() }

    #[event("openEscrow")]
    fn open_event(&self, #[indexed] id: u64, #[indexed] trade_id: &ManagedBuffer, #[indexed] payer: &ManagedAddress, #[indexed] seller: &ManagedAddress, amount: &BigUint, deadline: u64);

    #[event("release")]
    fn release_event(&self, #[indexed] id: u64, #[indexed] to: &ManagedAddress, amount: &BigUint);

    #[event("refund")]
    fn refund_event(&self, #[indexed] id: u64, #[indexed] to: &ManagedAddress, amount: &BigUint);

    #[event("dispute")]
    fn dispute_event(&self, #[indexed] id: u64, #[indexed] by: &ManagedAddress, at: u64);

    #[view]
    #[storage_mapper("lastId")]
    fn last_id(&self) -> SingleValueMapper<u64>;

    #[storage_mapper("escrows")]
    fn escrows(&self, id: u64) -> SingleValueMapper<Escrow<Self::Api>>;

    #[storage_mapper("tradeEscrowId")]
    fn trade_escrow_id(&self, trade_id: &ManagedBuffer) -> SingleValueMapper<u64>;

    #[view]
    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("pendingOwner")]
    fn pending_owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[view]
    #[storage_mapper("paused")]
    fn paused(&self) -> SingleValueMapper<bool>;

    #[view]
    #[storage_mapper("attestor")]
    fn attestor(&self) -> SingleValueMapper<ManagedAddress>;
}
