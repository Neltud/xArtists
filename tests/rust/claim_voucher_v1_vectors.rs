// Cross-language claim voucher V1 framing fixture, std-only and OFFLINE.
// This is not an SC implementation, has NO Ed25519 verification or minting.
// order_hash is supplied from Node's SHA256 fixture; future SC must verify
// SHA256 end-to-end and Ed25519 using MultiversX VM crypto before testnet GO.

const DOMAIN: &[u8; 17] = b"XA-CLAIM-PACK-V1\0";
const ORDER_HASH_HEX: &str = "e6bc635174d7e7662636b2d416874a7395948ff38dac0bb0bb426add2b84be8c";
const MESSAGE_SHA256_FROM_NODE: &str =
    "d0db4848cb62c46a4ff7fbfde9306f705b9373a17add313aad6aa6a272b62a4c";

#[derive(Clone)]
struct ClaimV1 {
    chain_id: u8,
    sc_address: [u8; 32],
    signer_epoch: u32,
    order_hash: [u8; 32],
    pack_type: u8,
    buyer: [u8; 32],
    amount_cents: u64,
    not_before: u64,
    expires_at: u64,
    catalog_version: u16,
}

fn decode_hex(raw: &str) -> Vec<u8> {
    assert_eq!(raw.len() % 2, 0);
    raw.as_bytes()
        .chunks_exact(2)
        .map(|ch| {
            let chunk = core::str::from_utf8(ch).unwrap();
            u8::from_str_radix(chunk, 16).unwrap()
        })
        .collect()
}
fn to_hex(data: &[u8]) -> String {
    data.iter().map(|b| format!("{:02x}", b)).collect::<String>()
}
fn vector() -> ClaimV1 {
    ClaimV1 {
        chain_id: b'T',
        sc_address: [0x11; 32],
        signer_epoch: 7,
        order_hash: decode_hex(ORDER_HASH_HEX).try_into().unwrap(),
        pack_type: 1,
        buyer: [0x22; 32],
        amount_cents: 11_000,
        not_before: 1_793_707_200,
        expires_at: 1_793_707_800,
        catalog_version: 1,
    }
}

/// Mirror of the 146-byte Node V1 *payload framing*, never a signer.
/// Returns Invalid for a wrong chain, EUR amount, timestamp, epoch or version.
/// The chain/SC identity MUST be checked by the deployed SC, not trusted from client.
fn encode_claim_v1(p: &ClaimV1) -> Result<Vec<u8>, &'static str> {
    if ![b'1', b'T', b'D'].contains(&p.chain_id) {
        return Err("invalid_chain_id");
    }
    if p.signer_epoch == 0 {
        return Err("unconfigured_signer_epoch");
    }
    let fixed_price = match p.pack_type {
        1 => 11_000,
        2 => 7_500,
        3 => 5_000,
        _ => return Err("invalid_pack_type"),
    };
    if p.amount_cents != fixed_price {
        return Err("catalogue_amount_mismatch");
    }
    if p.catalog_version != 1 {
        return Err("catalog_version_unsupported");
    }
    if p.not_before == 0
        || p.expires_at <= p.not_before
        || p.expires_at - p.not_before > 900
    {
        return Err("claim_expiry_invalid");
    }

    let mut out = Vec::with_capacity(146);
    out.extend_from_slice(DOMAIN);
    out.push(1);
    out.push(p.chain_id);
    out.extend_from_slice(&p.sc_address);
    out.extend_from_slice(&p.signer_epoch.to_be_bytes());
    out.extend_from_slice(&p.order_hash);
    out.push(p.pack_type);
    out.extend_from_slice(&p.buyer);
    out.extend_from_slice(&p.amount_cents.to_be_bytes());
    out.extend_from_slice(&p.not_before.to_be_bytes());
    out.extend_from_slice(&p.expires_at.to_be_bytes());
    out.extend_from_slice(&p.catalog_version.to_be_bytes());
    assert_eq!(out.len(), 146);
    Ok(out)
}

#[test]
fn golden_node_payload_matches_rust_byte_for_byte() {
    let bytes = encode_claim_v1(&vector()).unwrap();
    let expected = [
        "58412d434c41494d2d5041434b2d563100".to_string(),
        "0154".to_string(),
        "11".repeat(32),
        "00000007".to_string(),
        ORDER_HASH_HEX.to_string(),
        "01".to_string(),
        "22".repeat(32),
        "0000000000002af8".to_string(),
        "000000006ae9ccc0".to_string(),
        "000000006ae9cf18".to_string(),
        "0001".to_string(),
    ].join("");
    assert_eq!(bytes.len(), 146);
    assert_eq!(to_hex(&bytes), expected);
    // Digest is a Node SHA-256 golden; no digest algorithm implemented here.
    assert_eq!(MESSAGE_SHA256_FROM_NODE.len(), 64);
}

#[test]
fn domain_and_order_hash_are_exact_constants() {
    assert_eq!(DOMAIN, b"XA-CLAIM-PACK-V1\0");
    assert_eq!(DOMAIN.len(), 17);
    assert_eq!(decode_hex(ORDER_HASH_HEX).len(), 32);
}

#[test]
fn chain_binding_and_epoch_refuse_downgrade() {
    let mut p = vector();
    p.chain_id = b'X';
    assert_eq!(encode_claim_v1(&p).unwrap_err(), "invalid_chain_id");
    p.chain_id = b'1';
    assert_ne!(encode_claim_v1(&p).unwrap(), encode_claim_v1(&vector()).unwrap());
    p.signer_epoch = 0;
    assert_eq!(encode_claim_v1(&p).unwrap_err(), "unconfigured_signer_epoch");
}

#[test]
fn buyer_contract_and_order_changes_modify_signed_bytes() {
    let baseline = encode_claim_v1(&vector()).unwrap();
    let mut p = vector();
    p.buyer[0] = 0x99;
    assert_ne!(encode_claim_v1(&p).unwrap(), baseline);
    p = vector();
    p.sc_address[0] = 0x77;
    assert_ne!(encode_claim_v1(&p).unwrap(), baseline);
    p = vector();
    p.order_hash[0] ^= 0x10;
    assert_ne!(encode_claim_v1(&p).unwrap(), baseline);
}

#[test]
fn exact_fiat_catalogue_and_version_immutable_for_v1() {
    let mut p = vector();
    p.amount_cents = 10999;
    assert_eq!(encode_claim_v1(&p).unwrap_err(), "catalogue_amount_mismatch");
    p = vector();
    p.pack_type = 2;
    assert_eq!(encode_claim_v1(&p).unwrap_err(), "catalogue_amount_mismatch");
    p.amount_cents = 7_500;
    assert!(encode_claim_v1(&p).is_ok());
    p.pack_type = 3;
    p.amount_cents = 5_000;
    assert!(encode_claim_v1(&p).is_ok());
    p.catalog_version = 2;
    assert_eq!(encode_claim_v1(&p).unwrap_err(), "catalog_version_unsupported");
}

#[test]
fn expiration_is_fail_closed_and_not_longer_than_900_seconds() {
    let mut p = vector();
    p.expires_at = p.not_before;
    assert_eq!(encode_claim_v1(&p).unwrap_err(), "claim_expiry_invalid");
    p.expires_at = p.not_before + 901;
    assert_eq!(encode_claim_v1(&p).unwrap_err(), "claim_expiry_invalid");
    p.expires_at = p.not_before + 900;
    assert!(encode_claim_v1(&p).is_ok());
    p.not_before = 0;
    assert_eq!(encode_claim_v1(&p).unwrap_err(), "claim_expiry_invalid");
}
