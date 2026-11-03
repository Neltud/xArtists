//! claimPack V2 offline Node/Rust byte parity, 0.66.2-independent pure Rust.
 //! No VM, deployment, network attestation, private signer or payments.
 //! This tests byte layout ONLY; #328 still blocks testnet deployment.

const GOLDEN_HEX: &str = "58412d434c41494d2d5041434b2d56320001541111111111111111111111111111111111111111111111111111111111111111333333333333333333333333333333333333333333333333333333333333333300000001ff2a71382133d6506e867241979d466fcc5f375ef848f63b6bab27fa08d20cda0344444444444444444444444444444444444444444444444444444444444444440000000000001388000000006ae9ccc0000000006ae9cf180001";

fn from_hex(hex: &str) -> Vec<u8> {
    assert_eq!(hex.len() % 2, 0);
    (0..hex.len()).step_by(2)
        .map(|i| u8::from_str_radix(&hex[i..i + 2], 16).unwrap())
        .collect()
}

// The order hash is SHA-256("xartists/order/v1\0" || "v2_offline_test_1").
// In production, the actual order-hash function is the V1 canonical codec.
const ORDER_HASH_HEX: &str = "ff2a71382133d6506e867241979d466fcc5f375ef848f63b6bab27fa08d20cda";

fn encode_fixture(deployment_tx_hash: [u8; 32]) -> Vec<u8> {
    assert_ne!(deployment_tx_hash, [0u8; 32], "zero anchor rejected");
    let mut out = Vec::with_capacity(178);
    out.extend_from_slice(b"XA-CLAIM-PACK-V2\0");
    out.extend_from_slice(&[1u8, b'T']);
    out.extend_from_slice(&deployment_tx_hash);
    out.extend_from_slice(&[0x33; 32]); // SC address; same on both networks
    out.extend_from_slice(&1u32.to_be_bytes()); // signer epoch
    out.extend_from_slice(&from_hex(ORDER_HASH_HEX));
    out.push(3); // Sentinel
    out.extend_from_slice(&[0x44; 32]); // buyer wallet
    out.extend_from_slice(&5000u64.to_be_bytes());
    out.extend_from_slice(&1793707200u64.to_be_bytes());
    out.extend_from_slice(&1793707800u64.to_be_bytes());
    out.extend_from_slice(&1u16.to_be_bytes());
    assert_eq!(out.len(), 178);
    out
}

#[test]
fn v2_rust_matches_node_golden_178_bytes() {
    let actual = encode_fixture([0x11; 32]);
    assert_eq!(actual, from_hex(GOLDEN_HEX));
    assert_eq!(&actual[0..17], b"XA-CLAIM-PACK-V2\0");
    assert_eq!(&actual[17..19], &[1, b'T']);
    assert_eq!(&actual[19..51], &[0x11; 32]);
}

#[test]
fn same_address_key_buyer_and_order_with_different_deploy_hashes_have_distinct_bytes() {
    let t = encode_fixture([0x11; 32]);
    let other = encode_fixture([0x22; 32]);
    assert_ne!(t, other);
    assert_eq!(&t[0..19], &other[0..19]);
    assert_ne!(&t[19..51], &other[19..51]);
    assert_eq!(&t[51..], &other[51..]);
}

#[test]
fn duplicate_deploy_hash_is_an_explicit_negative_control() {
    // A malicious VM copying a deploy hash is *not* defeated by this layout.
    assert_eq!(encode_fixture([0x11; 32]), encode_fixture([0x11; 32]));
}

#[test]
#[should_panic(expected = "zero anchor rejected")]
fn zero_anchor_is_disallowed() {
    encode_fixture([0; 32]);
}
