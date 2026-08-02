#![no_std]

//! Soul zk Verifier — MultiversX on-chain gate (Phase 1)
//!
//! Phase 1 (this contract):
//!   - Register scheme: Halo2 | Groth16
//!   - verifyProof: structural checks + commitment bind + nullifier anti-replay
//!   - Optional trusted attestor cosign (relayer / prover service)
//!   - Does NOT run full pairing/Halo2 math on-chain (gas + no native pairing API)
//!
//! Phase 2 (future):
//!   - Plug external verifier library or precompile when available
//!   - Keep same endpoint ABI: verifyProof

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

const MAX_PROOF_LEN: usize = 8192;
const MIN_PROOF_LEN: usize = 32;
const MAX_COMMITMENT_LEN: usize = 64;
const SCHEME_HALO2: u8 = 1;
const SCHEME_GROTH16: u8 = 2;

#[derive(TypeAbi, TopEncode, TopDecode, NestedEncode, NestedDecode, Clone, PartialEq)]
pub enum SchemeId {
    None,
    Halo2,
    Groth16,
}

#[multiversx_sc::contract]
pub trait SoulZkVerifier {
    #[init]
    fn init(&self, scheme: u8) {
        let caller = self.blockchain().get_caller();
        self.owner().set(&caller);
        self.pending_owner().clear();
        self.paused().set(false);
        self.attestation_required().set(true);
        self.set_scheme_internal(scheme);
        self.vk_hash().clear();
        self.verified_count().set(0u64);
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

    fn set_scheme_internal(&self, scheme: u8) {
        require!(
            scheme == SCHEME_HALO2 || scheme == SCHEME_GROTH16,
            "scheme must be 1=Halo2 or 2=Groth16"
        );
        self.scheme().set(scheme);
    }

    // ─── Admin ───────────────────────────────────────────────

    #[endpoint(setPaused)]
    fn set_paused(&self, value: bool) {
        self.require_owner();
        self.paused().set(value);
    }

    #[endpoint(setScheme)]
    fn set_scheme(&self, scheme: u8) {
        self.require_owner();
        self.set_scheme_internal(scheme);
    }

    /// Hash of verifying key / circuit params (off-chain Halo2/Groth16 VK)
    #[endpoint(setVkHash)]
    fn set_vk_hash(&self, vk_hash: ManagedBuffer) {
        self.require_owner();
        require!(
            vk_hash.len() >= 16 && vk_hash.len() <= MAX_COMMITMENT_LEN,
            "invalid vk_hash length"
        );
        self.vk_hash().set(&vk_hash);
    }

    #[endpoint(setAttestationRequired)]
    fn set_attestation_required(&self, value: bool) {
        self.require_owner();
        self.attestation_required().set(value);
    }

    #[endpoint(setAttestor)]
    fn set_attestor(&self, attestor: ManagedAddress) {
        self.require_owner();
        require!(!attestor.is_zero(), "zero address");
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

    // ─── Verify ──────────────────────────────────────────────

    /// Phase-1 verify:
    /// - not paused, scheme set, vk_hash set
    /// - proof length bounds
    /// - commitment + nullifier non-empty, nullifier unused
    /// - if attestation_required: caller must be attestor (prover relay)
    /// Returns true and marks nullifier used.
    #[endpoint(verifyProof)]
    fn verify_proof(
        &self,
        proof: ManagedBuffer,
        commitment: ManagedBuffer,
        nullifier: ManagedBuffer,
        claim_type: ManagedBuffer,
        epoch: u64,
        subject: ManagedAddress,
    ) -> bool {
        require!(!self.paused().get(), "paused");
        require!(!self.vk_hash().is_empty(), "vk_hash not set");

        let scheme = self.scheme().get();
        require!(
            scheme == SCHEME_HALO2 || scheme == SCHEME_GROTH16,
            "scheme not set"
        );

        require!(
            proof.len() >= MIN_PROOF_LEN && proof.len() <= MAX_PROOF_LEN,
            "invalid proof length"
        );
        require!(
            commitment.len() >= 16 && commitment.len() <= MAX_COMMITMENT_LEN,
            "invalid commitment"
        );
        require!(
            nullifier.len() >= 8 && nullifier.len() <= MAX_COMMITMENT_LEN,
            "invalid nullifier"
        );
        require!(claim_type.len() > 0 && claim_type.len() <= 32, "invalid claim_type");
        require!(!subject.is_zero(), "zero subject");

        require!(!self.nullifiers(&nullifier).get(), "nullifier already used");

        if self.attestation_required().get() {
            require!(!self.attestor().is_empty(), "attestor not set");
            require!(
                self.blockchain().get_caller() == self.attestor().get(),
                "only attestor"
            );
        }

        // Phase 1: structural + anti-replay. Full Halo2/Groth16 check is off-chain;
        // attestor is responsible for cryptographic validity before calling.
        // Phase 2: replace this block with native verify against vk_hash.

        self.nullifiers(&nullifier).set(true);
        let n = self.verified_count().get() + 1;
        self.verified_count().set(n);

        self.verify_event(
            n,
            &subject,
            &nullifier,
            &claim_type,
            epoch,
            scheme,
        );

        true
    }

    /// View-only structural check (does not consume nullifier)
    #[view(previewVerify)]
    fn preview_verify(
        &self,
        proof: ManagedBuffer,
        commitment: ManagedBuffer,
        nullifier: ManagedBuffer,
    ) -> bool {
        if self.paused().get() || self.vk_hash().is_empty() {
            return false;
        }
        let scheme = self.scheme().get();
        if scheme != SCHEME_HALO2 && scheme != SCHEME_GROTH16 {
            return false;
        }
        if proof.len() < MIN_PROOF_LEN || proof.len() > MAX_PROOF_LEN {
            return false;
        }
        if commitment.len() < 16 || nullifier.len() < 8 {
            return false;
        }
        if self.nullifiers(&nullifier).get() {
            return false;
        }
        true
    }

    // ─── Views ───────────────────────────────────────────────

    #[view(getScheme)]
    fn get_scheme(&self) -> u8 {
        self.scheme().get()
    }

    #[view(getVkHash)]
    fn get_vk_hash(&self) -> ManagedBuffer {
        if self.vk_hash().is_empty() {
            ManagedBuffer::new()
        } else {
            self.vk_hash().get()
        }
    }

    #[view(isNullifierUsed)]
    fn is_nullifier_used(&self, nullifier: ManagedBuffer) -> bool {
        self.nullifiers(&nullifier).get()
    }

    #[view(getVerifiedCount)]
    fn get_verified_count(&self) -> u64 {
        self.verified_count().get()
    }

    #[view(getOwner)]
    fn get_owner_view(&self) -> ManagedAddress {
        self.owner().get()
    }

    #[view(isPaused)]
    fn is_paused(&self) -> bool {
        self.paused().get()
    }

    #[view(getAttestor)]
    fn get_attestor(&self) -> OptionalValue<ManagedAddress> {
        if self.attestor().is_empty() {
            OptionalValue::None
        } else {
            OptionalValue::Some(self.attestor().get())
        }
    }

    #[event("verify")]
    fn verify_event(
        &self,
        #[indexed] id: u64,
        #[indexed] subject: &ManagedAddress,
        #[indexed] nullifier: &ManagedBuffer,
        claim_type: &ManagedBuffer,
        epoch: u64,
        scheme: u8,
    );

    #[view]
    #[storage_mapper("owner")]
    fn owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[storage_mapper("pendingOwner")]
    fn pending_owner(&self) -> SingleValueMapper<ManagedAddress>;

    #[view]
    #[storage_mapper("paused")]
    fn paused(&self) -> SingleValueMapper<bool>;

    #[view]
    #[storage_mapper("scheme")]
    fn scheme(&self) -> SingleValueMapper<u8>;

    #[storage_mapper("vkHash")]
    fn vk_hash(&self) -> SingleValueMapper<ManagedBuffer>;

    #[storage_mapper("attestor")]
    fn attestor(&self) -> SingleValueMapper<ManagedAddress>;

    #[view]
    #[storage_mapper("attestationRequired")]
    fn attestation_required(&self) -> SingleValueMapper<bool>;

    #[storage_mapper("nullifiers")]
    fn nullifiers(&self, nullifier: &ManagedBuffer) -> SingleValueMapper<bool>;

    #[view]
    #[storage_mapper("verifiedCount")]
    fn verified_count(&self) -> SingleValueMapper<u64>;
}
