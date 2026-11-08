//! Mainnet Pulse #005 guardrail tests — no private keys, IPFS writes, or broadcasts.
use agents_marketplace::{contract_obj, AgentsMarketplace, ContractObj};
use multiversx_sc::types::{heap::Address, ManagedAddress, ManagedBuffer, EsdtLocalRole};
use multiversx_sc_scenario::{
    managed_token_id, rust_biguint, DebugApi,
    whitebox_legacy::{BlockchainStateWrapper, ContractObjWrapper, TxResult},
};

const TOKEN: &[u8] = b"XAIPLS-2cf72b";
const CID: &str = "bafybeigdyrzt5sfp7udm7hu76bvy4j4xejpvxa2cqarjfic7znt7obgxyy";
type Builder = fn() -> ContractObj<DebugApi>;

struct Setup {
    world: BlockchainStateWrapper,
    owner: Address,
    buyer: Address,
    recipient: Address,
    sc: ContractObjWrapper<ContractObj<DebugApi>, Builder>,
}

fn setup(configure_collection: bool) -> Setup {
    let mut world = BlockchainStateWrapper::new();
    let zero = rust_biguint!(0u64);
    let owner = world.create_user_account(&zero);
    let buyer = world.create_user_account(&rust_biguint!(5_000_000_000_000_000_000u64));
    let recipient = world.create_user_account(&zero);
    let builder: Builder = contract_obj::<DebugApi>;
    let sc = world.create_sc_account(
        &zero, Some(&owner), builder, "file:output/agents-marketplace.wasm",
    );
    world.execute_tx(&owner, &sc, &zero, |contract| contract.init(300)).assert_ok();
    if configure_collection {
        world.execute_tx(&owner, &sc, &zero, |contract| {
            contract.set_pack_collection(1, managed_token_id!(TOKEN));
        }).assert_ok();
    }
    Setup { world, owner, buyer, recipient, sc }
}

fn uri(filename: &str) -> ManagedBuffer<DebugApi> {
    let mut u = ManagedBuffer::from(&b"ipfs://"[..]);
    u.append_bytes(CID.as_bytes());
    u.append_bytes(b"/");
    u.append_bytes(filename.as_bytes());
    u
}

impl Setup {
    fn mint(&mut self, caller: &Address, valid_metadata: bool) -> TxResult {
        let recipient = self.recipient.clone();
        self.world.execute_tx(caller, &self.sc, &rust_biguint!(0u64), |contract| {
            // Managed values MUST be created within the scenario's VM stack.
            let metadata = if valid_metadata {
                uri("metadata.json")
            } else {
                ManagedBuffer::from(&b"ipfs://pending"[..])
            };
            contract.mint_genesis_pulse_005(
                ManagedAddress::from(&recipient),
                metadata,
                uri("recto.png"),
                uri("verso.png"),
                uri("animation.mp4"),
                ManagedBuffer::from(&[0x77u8; 32][..]),
            );
        })
    }

    fn mint_with_metadata_uri(&mut self, caller: &Address, metadata_uri: &[u8]) -> TxResult {
        let recipient = self.recipient.clone();
        self.world.execute_tx(caller, &self.sc, &rust_biguint!(0u64), |contract| {
            contract.mint_genesis_pulse_005(
                ManagedAddress::from(&recipient),
                ManagedBuffer::from(metadata_uri),
                uri("recto.png"),
                uri("verso.png"),
                uri("animation.mp4"),
                ManagedBuffer::from(&[0x77u8; 32][..]),
            );
        })
    }

    fn minted_marker(&mut self) -> bool {
        let mut minted = false;
        self.world.execute_query(&self.sc, |contract| {
            minted = contract.genesis_pulse_005_minted().get();
        }).assert_ok();
        minted
    }
}

#[test]
fn p005_only_stored_contract_owner_may_initiate_mint() {
    let mut t = setup(true);
    let buyer = t.buyer.clone();
    t.mint(&buyer, true).assert_user_error("only owner");
    assert!(!t.minted_marker());
}

#[test]
fn p005_requires_exact_pulse_collection() {
    let mut t = setup(false);
    let owner = t.owner.clone();
    t.mint(&owner, true).assert_user_error("Pulse collection missing");
    assert!(!t.minted_marker());
}

#[test]
fn p005_requires_pinned_metadata_filename_not_a_placeholder() {
    let mut t = setup(true);
    let owner = t.owner.clone();
    t.mint(&owner, false)
        .assert_user_error("invalid IPFS media URI length");
    assert!(!t.minted_marker());
}

#[test]
fn p005_missing_nft_create_role_cannot_mint_or_reserve_marker() {
    let mut t = setup(true);
    let owner = t.owner.clone();
    let result = t.mint(&owner, true);
    assert!(!result.result_status.is_success(), "roleless create should fail");
    assert!(!t.minted_marker(), "failed mint must not record one-shot success");
}

#[test]
fn p005_wrong_nonce_must_revert_without_delivery() {
    let mut t = setup(true);
    t.world.set_esdt_local_roles(t.sc.address_ref(), TOKEN, &[EsdtLocalRole::NftCreate]);
    let owner = t.owner.clone();
    // New test collection emits nonce 1: the special #005 endpoint MUST reject it.
    t.mint(&owner, true).assert_user_error("Pulse nonce 005 no longer available");
    assert!(!t.minted_marker());
    t.world.check_nft_balance(
        &t.recipient, TOKEN, 1, &rust_biguint!(0u64), None::<&u32>,
    );
}

#[test]
fn p005_happy_path_four_existing_packs_then_atomic_fifth_delivery_once() {
    let mut t = setup(true);
    t.world.set_esdt_local_roles(t.sc.address_ref(), TOKEN, &[EsdtLocalRole::NftCreate]);
    let buyer = t.buyer.clone();
    let owner = t.owner.clone();
    // Reproduce four existing nonce allocations by the legacy purchase route.
    // The test buyer has mock EGLD only. No real payment is executed.
    for _ in 0..4 {
        t.world.execute_tx(
            &buyer, &t.sc, &rust_biguint!(1_000_000_000_000_000_000u64),
            |contract| contract.buy_pack(1),
        ).assert_ok();
    }

    // Owner-only dedicated media mint should be the fifth NFT, transferred atomically.
    t.mint(&owner, true).assert_ok();
    assert!(t.minted_marker());
    t.world.check_nft_balance(
        &t.recipient, TOKEN, 5, &rust_biguint!(1u64), None::<&u32>,
    );

    // Replay is impossible even when the owner resubmits the same exact media URI.
    t.mint(&owner, true).assert_user_error("Pulse 005 already minted");
    t.world.check_nft_balance(
        &t.recipient, TOKEN, 5, &rust_biguint!(1u64), None::<&u32>,
    );
}

#[test]
fn p005_rejects_fake_long_cid_even_with_expected_filename() {
    let mut t = setup(true);
    let owner = t.owner.clone();
    t.mint_with_metadata_uri(
        &owner,
        b"ipfs://bafyaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!/metadata.json",
    ).assert_user_error("invalid IPFS CID character");
    assert!(!t.minted_marker());
}

#[test]
fn p005_refuses_non_directory_cid_or_incorrect_prefix() {
    let mut t = setup(true);
    let owner = t.owner.clone();
    t.mint_with_metadata_uri(
        &owner,
        b"ipfs://Qmaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/metadata.json",
    ).assert_user_error("requires CIDv1 bafy");
    assert!(!t.minted_marker());
}
