#![no_std]

//! xArtists claim voucher V1 — isolated TESTNET-ONLY prototype.
//!
//! NOT deployed. The live agents-marketplace, fiat pricing, PayBox, mint jobs,
//! signer keys and entitlements are untouched. No mainnet release authorization.
//! A separate on-chain chain identity gate and ESDT role/rollback scenarios
//! are required before any operator is allowed to deploy a testnet instance.

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

const CLAIM_DOMAIN: &[u8; 17] = b"XA-CLAIM-PACK-V1\0";
const NETWORK_TESTNET: u8 = b'T';
const CLAIM_V1_SIZE: usize = 146;
const MAX_TTL: u64 = 900;
const CATALOG_VERSION: u16 = 1;
const NFT_AMOUNT: u64 = 1;
// Metadata description only. A royalty is optional in secondary markets.
const ROYALTIES_BPS: u64 = 500;

#[multiversx_sc::contract]
pub trait XArtistsClaimPackTestnet {
    #[init]
    fn init(&self) {
        // Safe on deployment: even the owner must configure collection/signer
        // and explicitly unpause after review. Never enables mainnet checkout.
        self.claims_paused().set(true);
    }

    /// Immutable signer epoch. An epoch cannot be overwritten or re-enabled.
    #[only_owner]
    #[endpoint(registerClaimSigner)]
    fn register_claim_signer(&self, epoch: u32, public_key: ManagedByteArray<32>) {
        require!(self.claims_paused().get(), "pause before signer configuration");
        require!(epoch > 0, "invalid epoch");
        require!(self.signer(epoch).is_empty(), "signer epoch already registered");
        require!(!self.signer_disabled(epoch).get(), "epoch permanently disabled");
        require!(public_key.to_byte_array() != [0u8; 32], "zero signer");
        self.signer(epoch).set(public_key);
    }

    #[only_owner]
    #[endpoint(disableClaimSigner)]
    fn disable_claim_signer(&self, epoch: u32) {
        require!(epoch > 0, "invalid epoch");
        self.signer_disabled(epoch).set(true);
    }

    /// One collection per pack. Never change a collection after first set.
    /// SC must independently hold the ESDT NFT create role for every token.
    #[only_owner]
    #[endpoint(configurePackCollection)]
    fn configure_pack_collection(&self, pack_type: u8, token: TokenIdentifier) {
        require!(self.claims_paused().get(), "pause before configuring collection");
        require!(Self::price_cents(pack_type) > 0, "unknown pack");
        require!(token.is_valid_esdt_identifier(), "invalid collection");
        require!(self.pack_collection(pack_type).is_empty(), "collection sealed");
        self.pack_collection(pack_type).set(token);
    }

    #[only_owner]
    #[endpoint(pauseClaims)]
    fn pause_claims(&self) {
        self.claims_paused().set(true);
    }

    /// Defaults to paused. Explicit owner operation (NOT linked to PayBox).
    #[only_owner]
    #[endpoint(unpauseClaims)]
    fn unpause_claims(&self) {
        require!(
            !self.signer(1).is_empty() || !self.signer(2).is_empty(),
            "signer not configured"
        );
        self.claims_paused().set(false);
    }

    #[only_owner]
    #[endpoint(revokeOrderHash)]
    fn revoke_order_hash(&self, order_hash: ManagedByteArray<32>) {
        require!(!self.claimed(&order_hash).get(), "cannot unwind delivered NFT");
        self.revoked(&order_hash).set(true);
    }

    /// Buyer wallet is the caller, never a relay or a separately claimed owner.
    ///
    /// Testnet code compiles a literal 'T' domain, NOT a client-provided chain ID.
    /// A runtime chain-identity gate still must be independently verified before
    /// deployment; the same SC address on two networks is a theoretical replay
    /// hazard if operators deploy this testnet artifact outside testnet.
    #[endpoint(claimPack)]
    fn claim_pack(
        &self,
        pack_type: u8,
        order_hash: ManagedByteArray<32>,
        amount_cents: u64,
        not_before: u64,
        expires_at: u64,
        catalog_version: u16,
        signer_epoch: u32,
        signature: ManagedByteArray<64>,
    ) {
        require!(!self.claims_paused().get(), "claims paused");
        require!(!self.pack_collection(pack_type).is_empty(), "collection missing");
        let price = Self::price_cents(pack_type);
        require!(price > 0 && amount_cents == price, "catalogue mismatch");
        require!(catalog_version == CATALOG_VERSION, "catalogue version mismatch");
        require!(
            not_before > 0 && expires_at > not_before
                && expires_at - not_before <= MAX_TTL,
            "invalid claim window"
        );
        #[allow(deprecated)]
        let now = self.blockchain().get_block_timestamp();
        require!(now >= not_before && now <= expires_at, "claim expired or not yet valid");
        require!(!self.claimed(&order_hash).get(), "claim already used");
        require!(!self.revoked(&order_hash).get(), "claim revoked");
        require!(signer_epoch > 0 && !self.signer_disabled(signer_epoch).get(), "signer disabled");
        require!(!self.signer(signer_epoch).is_empty(), "signer unknown");
        let buyer = self.blockchain().get_caller();
        let sc = self.blockchain().get_sc_address();
        let message = self.message_bytes(
            &sc, &buyer, signer_epoch, &order_hash, pack_type,
            amount_cents, not_before, expires_at, catalog_version,
        );
        require!(message.len() == CLAIM_V1_SIZE, "internal message length");
        let signer = self.signer(signer_epoch).get();
        require!(
            self.crypto().verify_ed25519_legacy_managed::<CLAIM_V1_SIZE>(
                &signer, &message, &signature
            ),
            "invalid claim signature"
        );

        // Mark before mint; any ESDT create/transfer failure MUST revert this
        // storage write in the same on-chain transaction (scenario test TODO).
        self.claimed(&order_hash).set(true);

        let token = self.pack_collection(pack_type).get();
        let name = Self::pack_name(pack_type);
        let attributes = ManagedBuffer::from(&b"xartists:claim-v1;entitlement:pending-s2"[..]);
        let uris = ManagedVec::new();
        let nonce = self.send().esdt_nft_create(
            &token,
            &BigUint::from(NFT_AMOUNT),
            &name,
            &BigUint::from(ROYALTIES_BPS),
            &ManagedBuffer::new(),
            &attributes,
            &uris,
        );
        self.send().direct_esdt(
            &buyer, &token, nonce, &BigUint::from(NFT_AMOUNT),
        );
        self.pack_claimed_event(&order_hash, &buyer, pack_type, nonce);
    }

    /// Exact bytes from services/access-api/src/claimVoucherCodec.mjs.
    /// 17 domain | chain len and id | 32 SC | 4 epoch | 32 hash |
    /// 1 pack | 32 caller | 8 cents | 8 not-before | 8 expiry | 2 catalog.
    fn message_bytes(
        &self,
        sc: &ManagedAddress,
        buyer: &ManagedAddress,
        epoch: u32,
        order_hash: &ManagedByteArray<32>,
        pack: u8,
        cents: u64,
        start: u64,
        expiry: u64,
        catalogue: u16,
    ) -> ManagedBuffer {
        let mut out = ManagedBuffer::new();
        out.append_bytes(CLAIM_DOMAIN);
        out.append_bytes(&[1u8, NETWORK_TESTNET]);
        out.append(sc.as_managed_buffer());
        out.append_bytes(&epoch.to_be_bytes());
        out.append(order_hash.as_managed_buffer());
        out.append_bytes(&[pack]);
        out.append(buyer.as_managed_buffer());
        out.append_bytes(&cents.to_be_bytes());
        out.append_bytes(&start.to_be_bytes());
        out.append_bytes(&expiry.to_be_bytes());
        out.append_bytes(&catalogue.to_be_bytes());
        out
    }

    fn price_cents(pack: u8) -> u64 {
        match pack {
            1 => 11_000, // Pulse
            2 => 7_500,  // Yield
            3 => 5_000,  // Sentinel
            _ => 0,
        }
    }

    fn pack_name(pack: u8) -> ManagedBuffer {
        match pack {
            1 => ManagedBuffer::from(&b"xArtists Pulse"[..]),
            2 => ManagedBuffer::from(&b"xArtists Yield"[..]),
            3 => ManagedBuffer::from(&b"xArtists Sentinel"[..]),
            _ => sc_panic!("unknown pack"),
        }
    }

    #[view(isClaimed)]
    #[storage_mapper("claimedV1")]
    fn claimed(&self, order_hash: &ManagedByteArray<32>) -> SingleValueMapper<bool>;

    #[view(isRevoked)]
    #[storage_mapper("revokedV1")]
    fn revoked(&self, order_hash: &ManagedByteArray<32>) -> SingleValueMapper<bool>;

    #[view(isClaimsPaused)]
    #[storage_mapper("claimsPaused")]
    fn claims_paused(&self) -> SingleValueMapper<bool>;

    #[view(getClaimSigner)]
    #[storage_mapper("claimSigner")]
    fn signer(&self, epoch: u32) -> SingleValueMapper<ManagedByteArray<32>>;

    #[view(isSignerDisabled)]
    #[storage_mapper("signerDisabled")]
    fn signer_disabled(&self, epoch: u32) -> SingleValueMapper<bool>;

    #[view(getClaimCollection)]
    #[storage_mapper("claimCollection")]
    fn pack_collection(&self, pack_type: u8) -> SingleValueMapper<TokenIdentifier>;

    #[event("packClaimedV1")]
    fn pack_claimed_event(
        &self,
        #[indexed] order_hash: &ManagedByteArray<32>,
        #[indexed] buyer: &ManagedAddress,
        #[indexed] pack_type: u8,
        nonce: u64,
    );
}
