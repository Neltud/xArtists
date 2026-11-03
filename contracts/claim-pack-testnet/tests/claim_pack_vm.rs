//! xArtists claimPack V1: real MultiversX mocked-VM tests, NO NETWORK/DEPLOY.
//! These are NOT a testnet receipt or a production delivery confirmation.
//! Test-only Ed25519 seed is synthetic and NEVER an issuer/deployer key.

use ed25519_dalek::{Signer, SigningKey};
use multiversx_sc::types::{heap::Address, EsdtLocalRole, ManagedByteArray};
use multiversx_sc_scenario::{
    managed_token_id, rust_biguint, DebugApi,
    whitebox_legacy::{BlockchainStateWrapper, ContractObjWrapper, TxResult},
};
use xartists_claim_pack_testnet::{contract_obj, ContractObj, XArtistsClaimPackTestnet};

const TOKEN: &[u8] = b"XCLM-abcdef";
const EPOCH: u32 = 7;
const START: u64 = 1_793_707_200;
const EXPIRES: u64 = START + 600;
const ORDER_HASH: [u8; 32] = [0x33; 32];
const TEST_ONLY_SEED: [u8; 32] = [0x42; 32];
type Builder = fn() -> ContractObj<DebugApi>;

#[derive(Clone, Copy)]
struct Claim {
    pack: u8,
    hash: [u8; 32],
    cents: u64,
    start: u64,
    expires: u64,
    catalogue: u16,
    epoch: u32,
}

impl Default for Claim {
    fn default() -> Self {
        Self {
            pack: 1,
            hash: ORDER_HASH,
            cents: 11_000,
            start: START,
            expires: EXPIRES,
            catalogue: 1,
            epoch: EPOCH,
        }
    }
}

struct Setup {
    world: BlockchainStateWrapper,
    owner: Address,
    buyer: Address,
    other: Address,
    sc: ContractObjWrapper<ContractObj<DebugApi>, Builder>,
}

fn setup() -> Setup {
    let mut world = BlockchainStateWrapper::new();
    let zero = rust_biguint!(0u64);
    let owner = world.create_user_account(&zero);
    let buyer = world.create_user_account(&zero);
    let other = world.create_user_account(&zero);
    let builder: Builder = contract_obj::<DebugApi>;
    let sc = world.create_sc_account(
        &zero, Some(&owner), builder, "file:output/claim-pack-testnet.wasm",
    );
    world.execute_tx(&owner, &sc, &zero, |contract| {
        contract.init();
        assert!(contract.claims_paused().get());
    }).assert_ok();

    // TEST-ONLY key, never shared with access-api, Render or mainnet.
    let public = SigningKey::from_bytes(&TEST_ONLY_SEED).verifying_key().to_bytes();
    world.execute_tx(&owner, &sc, &zero, |contract| {
        contract.register_claim_signer(
            EPOCH, ManagedByteArray::new_from_bytes(&public),
        );
        contract.configure_pack_collection(1, managed_token_id!(TOKEN));
        assert_eq!(contract.active_signer_epoch().get(), EPOCH);
        contract.unpause_claims();
        assert!(!contract.claims_paused().get());
    }).assert_ok();
    world.set_block_timestamp(START + 60);
    Setup { world, owner, buyer, other, sc }
}

fn signed_bytes(sc: &Address, buyer: &Address, p: Claim) -> [u8; 146] {
    let mut out = Vec::<u8>::with_capacity(146);
    out.extend_from_slice(b"XA-CLAIM-PACK-V1\0");
    out.extend_from_slice(&[1, b'T']);
    out.extend_from_slice(sc.as_bytes());
    out.extend_from_slice(&p.epoch.to_be_bytes());
    out.extend_from_slice(&p.hash);
    out.push(p.pack);
    out.extend_from_slice(buyer.as_bytes());
    out.extend_from_slice(&p.cents.to_be_bytes());
    out.extend_from_slice(&p.start.to_be_bytes());
    out.extend_from_slice(&p.expires.to_be_bytes());
    out.extend_from_slice(&p.catalogue.to_be_bytes());
    assert_eq!(out.len(), 146);
    out.try_into().unwrap()
}

fn signature(sc: &Address, signed_buyer: &Address, p: Claim) -> [u8; 64] {
    SigningKey::from_bytes(&TEST_ONLY_SEED)
        .sign(&signed_bytes(sc, signed_buyer, p))
        .to_bytes()
}

impl Setup {
    fn execute(
        &mut self,
        caller: &Address,
        signed_buyer: &Address,
        p: Claim,
        signature_override: Option<[u8; 64]>,
    ) -> TxResult {
        let sig = signature_override.unwrap_or_else(|| signature(self.sc.address_ref(), signed_buyer, p));
        self.world.execute_tx(caller, &self.sc, &rust_biguint!(0u64), |contract| {
            contract.claim_pack(
                p.pack,
                ManagedByteArray::new_from_bytes(&p.hash),
                p.cents,
                p.start,
                p.expires,
                p.catalogue,
                p.epoch,
                ManagedByteArray::new_from_bytes(&sig),
            )
        })
    }
    fn role(&mut self) {
        self.world.set_esdt_local_roles(
            self.sc.address_ref(), TOKEN, &[EsdtLocalRole::NftCreate],
        );
    }
    fn claimed(&mut self, hash: [u8; 32]) -> bool {
        let mut result = false;
        self.world.execute_query(&self.sc, |contract| {
            result = contract.claimed(&ManagedByteArray::new_from_bytes(&hash)).get()
        }).assert_ok();
        result
    }
}

#[test]
fn t01_happy_path_mints_once_to_buyer_then_blocks_replay() {
    let mut setup = setup();
    setup.role();
    let buyer = setup.buyer.clone();
    setup.execute(&buyer, &buyer, Claim::default(), None).assert_ok();
    assert!(setup.claimed(ORDER_HASH));
    setup.world.check_nft_balance(&buyer, TOKEN, 1, &rust_biguint!(1u64), None::<&u32>);
    setup.execute(&buyer, &buyer, Claim::default(), None).assert_user_error("claim already used");
    setup.world.check_nft_balance(&buyer, TOKEN, 1, &rust_biguint!(1u64), None::<&u32>);
}

#[test]
fn t02_different_wallet_cannot_redeem_a_voucher_for_buyer() {
    let mut setup = setup();
    setup.role();
    let buyer = setup.buyer.clone();
    let other = setup.other.clone();
    let failed = setup.execute(&other, &buyer, Claim::default(), None);
    assert!(!failed.result_status.is_success(), "wrong caller signature must fail");
    assert_eq!(failed.result_message, "ed25519 verify error");
    assert!(!setup.claimed(ORDER_HASH));
    setup.world.check_nft_balance(&other, TOKEN, 1, &rust_biguint!(0u64), None::<&u32>);
}

#[test]
fn t03_expired_and_future_vouchers_do_not_reserve_hash() {
    let mut setup = setup();
    let buyer = setup.buyer.clone();
    let expired = Claim { start: START - 601, expires: START - 1, ..Claim::default() };
    setup.execute(&buyer, &buyer, expired, None).assert_user_error("claim expired or not yet valid");
    let future = Claim { start: START + 300, expires: START + 600, ..Claim::default() };
    setup.execute(&buyer, &buyer, future, None).assert_user_error("claim expired or not yet valid");
    let overlong = Claim { expires: START + 901, ..Claim::default() };
    setup.execute(&buyer, &buyer, overlong, None).assert_user_error("invalid claim window");
    assert!(!setup.claimed(ORDER_HASH));
}

#[test]
fn t04_wrong_signature_and_unknown_epoch_rejected() {
    let mut setup = setup();
    let buyer = setup.buyer.clone();
    let mut bad = signature(setup.sc.address_ref(), &buyer, Claim::default());
    bad[0] ^= 0x20;
    let failed = setup.execute(&buyer, &buyer, Claim::default(), Some(bad));
    assert!(!failed.result_status.is_success(), "tampered signature must fail");
    assert_eq!(failed.result_message, "ed25519 verify error");
    let epoch = Claim {epoch: 8, ..Claim::default()};
    setup.execute(&buyer, &buyer, epoch, None).assert_user_error("signer epoch stale");
    assert!(!setup.claimed(ORDER_HASH));
}

#[test]
fn t05_pack_price_and_catalogue_version_are_exact() {
    let mut setup = setup();
    let buyer = setup.buyer.clone();
    let amount = Claim {cents:10_999, ..Claim::default()};
    setup.execute(&buyer, &buyer, amount, None).assert_user_error("catalogue mismatch");
    let catalogue = Claim {catalogue: 2, ..Claim::default()};
    setup.execute(&buyer, &buyer, catalogue, None).assert_user_error("catalogue version mismatch");
    assert!(!setup.claimed(ORDER_HASH));
}

#[test]
fn t06_revoked_order_never_mints() {
    let mut setup = setup();
    let owner = setup.owner.clone();
    let buyer = setup.buyer.clone();
    setup.world.execute_tx(&owner, &setup.sc, &rust_biguint!(0u64), |contract| {
        contract.revoke_order_hash(ManagedByteArray::new_from_bytes(&ORDER_HASH));
    }).assert_ok();
    setup.execute(&buyer, &buyer, Claim::default(), None).assert_user_error("claim revoked");
    assert!(!setup.claimed(ORDER_HASH));
}

#[test]
fn t07_pause_is_owner_controlled_and_blocks_claims() {
    let mut setup = setup();
    let owner = setup.owner.clone();
    let buyer = setup.buyer.clone();
    setup.world.execute_tx(&owner, &setup.sc, &rust_biguint!(0u64), |contract| {
        contract.pause_claims()
    }).assert_ok();
    setup.execute(&buyer, &buyer, Claim::default(), None).assert_user_error("claims paused");
    assert!(!setup.claimed(ORDER_HASH));
}

#[test]
fn t08_repeat_order_hash_with_modified_other_fields_is_still_replay() {
    let mut setup = setup();
    setup.role();
    let buyer = setup.buyer.clone();
    setup.execute(&buyer, &buyer, Claim::default(), None).assert_ok();
    let modified = Claim {expires: EXPIRES + 1, ..Claim::default()};
    setup.execute(&buyer, &buyer, modified, None).assert_user_error("claim already used");
    assert!(setup.claimed(ORDER_HASH));
}

#[test]
fn t09_missing_nft_create_role_reverts_storage_reservation() {
    let mut setup = setup();
    let buyer = setup.buyer.clone();
    // No ESDTNFTCreate role. Should fail in VM and leave claimed=false.
    let result = setup.execute(&buyer, &buyer, Claim::default(), None);
    assert!(!result.result_status.is_success(), "mint without local role unexpectedly succeeded");
    assert!(!setup.claimed(ORDER_HASH));
    setup.world.check_nft_balance(&buyer, TOKEN, 1, &rust_biguint!(0u64), None::<&u32>);
}

#[test]
fn t10_disable_current_signer_auto_pauses_and_cannot_be_reenabled() {
    let mut setup = setup();
    let owner = setup.owner.clone();
    let buyer = setup.buyer.clone();
    setup.world.execute_tx(&owner, &setup.sc, &rust_biguint!(0u64), |contract| {
        contract.disable_claim_signer(EPOCH);
        assert!(contract.claims_paused().get());
    }).assert_ok();
    setup.execute(&buyer, &buyer, Claim::default(), None).assert_user_error("claims paused");
    assert!(!setup.claimed(ORDER_HASH));
}
