//! RustVM scenario checks. NO mainnet, no custody key, no external services.
//! This tests a fresh contract instance; historic on-chain storage migration
//! remains NO-GO until independent snapshot/upgrade scenario validation.
use multiversx_sc::types::{heap::Address, ManagedAddress, ManagedBuffer};
use multiversx_sc_scenario::{
    rust_biguint,
    DebugApi,
    whitebox_legacy::{BlockchainStateWrapper, ContractObjWrapper, TxResult},
};
use rwa_escrow_bridge::{contract_obj, ContractObj, RwaEscrowBridge};

type Builder = fn() -> ContractObj<DebugApi>;
const START: u64 = 1_700_000_000;
const COOLING: u64 = 7 * 24 * 3600;
const FUNDS: u64 = 500;

struct Setup {
    world: BlockchainStateWrapper,
    owner: Address,
    attestor: Address,
    payer: Address,
    seller: Address,
    outsider: Address,
    sc: ContractObjWrapper<ContractObj<DebugApi>, Builder>,
}

fn setup() -> Setup {
    let mut world = BlockchainStateWrapper::new();
    world.set_block_timestamp(START);
    let zero = rust_biguint!(0u64);
    let owner = world.create_user_account(&zero);
    let attestor = world.create_user_account(&zero);
    let payer = world.create_user_account(&rust_biguint!(1000u64));
    let seller = world.create_user_account(&zero);
    let outsider = world.create_user_account(&zero);
    let sc = world.create_sc_account(
        &zero, Some(&owner), contract_obj::<DebugApi> as Builder,
        "file:output/rwa-escrow-bridge.wasm",
    );
    world.execute_tx(&owner, &sc, &zero, |contract| {
        contract.init(ManagedAddress::from(&attestor));
    }).assert_ok();
    Setup { world, owner, attestor, payer, seller, outsider, sc }
}

impl Setup {
    fn open(&mut self) {
        let seller = self.seller.clone();
        self.world.execute_tx(&self.payer, &self.sc, &rust_biguint!(FUNDS), |contract| {
            contract.open_escrow(
                ManagedBuffer::from(&b"trade-001"[..]),
                ManagedAddress::from(&seller),
                ManagedBuffer::from(&b"source-hash"[..]),
                START + 600,
            );
        }).assert_ok();
        self.world.check_egld_balance(self.sc.address_ref(), &rust_biguint!(FUNDS));
        self.world.check_egld_balance(&self.payer, &rust_biguint!(1000u64-FUNDS));
    }

    fn receipt(&mut self) {
        self.world.execute_tx(&self.payer, &self.sc, &rust_biguint!(0u64), |contract| {
            contract.confirm_receipt(1);
        }).assert_ok();
    }

    fn authenticity(&mut self) {
        self.world.execute_tx(&self.attestor, &self.sc, &rust_biguint!(0u64), |contract| {
            contract.submit_verification_proof(1, ManagedBuffer::from(&b"auth-hash"[..]));
        }).assert_ok();
    }

    fn quality(&mut self) {
        self.world.execute_tx(&self.attestor, &self.sc, &rust_biguint!(0u64), |contract| {
            contract.attest_quality_inspection(1, ManagedBuffer::from(&b"quality-hash"[..]));
        }).assert_ok();
    }

    fn ownership(&mut self) {
        self.world.execute_tx(&self.attestor, &self.sc, &rust_biguint!(0u64), |contract| {
            contract.attest_ownership_reassignment(1, ManagedBuffer::from(&b"title-hash"[..]));
        }).assert_ok();
    }

    fn attempt_release(&mut self, caller: &Address) -> TxResult {
        self.world.execute_tx(caller, &self.sc, &rust_biguint!(0u64), |contract| {
            contract.release(1);
        })
    }
}

#[test]
fn only_complete_four_gate_chain_releases_once_to_seller() {
    let mut t = setup();
    t.open();
    let attestor = t.attestor.clone();
    t.attempt_release(&attestor).assert_user_error("receipt not confirmed");
    t.receipt();
    t.attempt_release(&attestor).assert_user_error("authenticity not verified");
    t.authenticity();
    t.attempt_release(&attestor).assert_user_error("quality not verified");
    t.quality();
    t.attempt_release(&attestor).assert_user_error("ownership not reassigned");
    t.ownership();
    let outsider = t.outsider.clone();
    t.attempt_release(&outsider).assert_user_error("only attestor");
    t.world.check_egld_balance(t.sc.address_ref(), &rust_biguint!(FUNDS));
    t.attempt_release(&attestor).assert_ok();
    t.world.check_egld_balance(t.sc.address_ref(), &rust_biguint!(0u64));
    t.world.check_egld_balance(&t.seller, &rust_biguint!(FUNDS));
    t.attempt_release(&attestor).assert_user_error("not open or disputed");
    t.world.check_egld_balance(&t.seller, &rust_biguint!(FUNDS));
}

#[test]
fn no_attestor_impersonation_and_no_early_refund() {
    let mut t = setup();
    t.open();
    let attacker = t.outsider.clone();
    t.world.execute_tx(&attacker, &t.sc, &rust_biguint!(0u64), |contract| {
        contract.submit_verification_proof(1, ManagedBuffer::from(&b"forged"[..]));
    }).assert_user_error("only attestor");
    t.world.execute_tx(&attacker, &t.sc, &rust_biguint!(0u64), |contract| {
        contract.attest_quality_inspection(1, ManagedBuffer::from(&b"forged"[..]));
    }).assert_user_error("only attestor");
    t.world.execute_tx(&attacker, &t.sc, &rust_biguint!(0u64), |contract| {
        contract.attest_ownership_reassignment(1, ManagedBuffer::from(&b"forged"[..]));
    }).assert_user_error("only attestor");
    t.world.execute_tx(&attacker, &t.sc, &rust_biguint!(0u64), |contract| {
        contract.refund(1);
    }).assert_user_error("too early");
    t.world.check_egld_balance(t.sc.address_ref(), &rust_biguint!(FUNDS));
    t.world.set_block_timestamp(START + 601);
    t.world.execute_tx(&attacker, &t.sc, &rust_biguint!(0u64), |contract| {
        contract.refund(1);
    }).assert_ok();
    t.world.check_egld_balance(&t.payer, &rust_biguint!(1000u64));
    t.world.check_egld_balance(t.sc.address_ref(), &rust_biguint!(0u64));
    let attestor = t.attestor.clone();
    t.attempt_release(&attestor).assert_user_error("not open or disputed");
}

#[test]
fn dispute_never_bypasses_cooling_or_proofs() {
    let mut t = setup();
    t.open();
    // A dispute blocks additional attestation, so incomplete evidence must
    // never be converted into seller payment merely by owner arbitration.
    t.world.execute_tx(&t.payer, &t.sc, &rust_biguint!(0u64), |contract| {
        contract.open_dispute(1);
    }).assert_ok();
    t.world.set_block_timestamp(START + COOLING - 1);
    t.world.execute_tx(&t.owner, &t.sc, &rust_biguint!(0u64), |contract| {
        contract.resolve_dispute(1, true);
    }).assert_user_error("dispute cooling active");
    t.world.set_block_timestamp(START + COOLING);
    t.world.execute_tx(&t.owner, &t.sc, &rust_biguint!(0u64), |contract| {
        contract.resolve_dispute(1, true);
    }).assert_user_error("receipt not confirmed");
    t.world.check_egld_balance(t.sc.address_ref(), &rust_biguint!(FUNDS));
    t.world.execute_tx(&t.owner, &t.sc, &rust_biguint!(0u64), |contract| {
        contract.resolve_dispute(1, false);
    }).assert_ok();
    t.world.check_egld_balance(&t.payer, &rust_biguint!(1000u64));
    t.world.check_egld_balance(&t.seller, &rust_biguint!(0u64));
}

#[test]
fn seller_arbitration_requires_complete_evidence_before_dispute() {
    let mut t = setup();
    t.open();
    t.receipt();
    t.authenticity();
    t.quality();
    t.ownership();
    t.world.execute_tx(&t.seller, &t.sc, &rust_biguint!(0u64), |contract| {
        contract.open_dispute(1);
    }).assert_ok();
    t.world.set_block_timestamp(START + COOLING);
    t.world.execute_tx(&t.outsider, &t.sc, &rust_biguint!(0u64), |contract| {
        contract.resolve_dispute(1, true);
    }).assert_user_error("only owner resolves");
    t.world.execute_tx(&t.owner, &t.sc, &rust_biguint!(0u64), |contract| {
        contract.resolve_dispute(1, true);
    }).assert_ok();
    t.world.check_egld_balance(&t.seller, &rust_biguint!(FUNDS));
    t.world.check_egld_balance(t.sc.address_ref(), &rust_biguint!(0u64));
}
