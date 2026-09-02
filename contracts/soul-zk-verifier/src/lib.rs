#![no_std]

//! Soul zk Verifier — MultiversX on-chain gate (Phase 1)
//! Proof bounds are scheme-aware to reject junk early and limit gas.

multiversx_sc::imports!();
multiversx_sc::derive_imports!();

// ─── Proof length bounds (bytes) ─────────────────────────────
// Halo2: flexible transcript; practical range for our envelopes
const HALO2_PROOF_MIN: usize = 64;
const HALO2_PROOF_MAX: usize = 4096;
// Groth16 BN254 compressed-ish / standard ~192–288B; allow headroom
const GROTH16_PROOF_MIN: usize = 128;
const GROTH16_PROOF_MAX: usize = 512;
// Absolute hard cap (DoS)
const PROOF_HARD_MAX: usize = 4096;

const COMMITMENT_LEN: usize = 32; // sha256
const NULLIFIER_MIN: usize = 16;
const NULLIFIER_MAX: usize = 32;
const CLAIM_TYPE_MAX: usize = 24;
const VK_HASH_LEN: usize = 32;

const SCHEME_HALO2: u8 = 1;
const SCHEME_GROTH16: u8 = 2;

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

    fn proof_bounds(&self, scheme: u8) -> (usize, usize) {
        if scheme == SCHEME_GROTH16 {
            (GROTH16_PROOF_MIN, GROTH16_PROOF_MAX)
        } else {
            (HALO2_PROOF_MIN, HALO2_PROOF_MAX)
        }
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

    #[endpoint(setVkHash)]
    fn set_vk_hash(&self, vk_hash: ManagedBuffer) {
        self.require_owner();
        require!(vk_hash.len() == VK_HASH_LEN, "vk_hash must be 32 bytes");
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

        let (pmin, pmax) = self.proof_bounds(scheme);
        let plen = proof.len();
        require!(plen >= pmin && plen <= pmax, "proof length out of bounds");
        require!(plen <= PROOF_HARD_MAX, "proof exceeds hard max");

        require!(commitment.len() == COMMITMENT_LEN, "commitment must be 32 bytes");
        require!(
            nullifier.len() >= NULLIFIER_MIN && nullifier.len() <= NULLIFIER_MAX,
            "nullifier length out of bounds"
        );
        require!(
            claim_type.len() > 0 && claim_type.len() <= CLAIM_TYPE_MAX,
            "invalid claim_type length"
        );
        require!(!subject.is_zero(), "zero subject");

        require!(!self.nullifiers(&nullifier).get(), "nullifier already used");

        if self.attestation_required().get() {
            require!(!self.attestor().is_empty(), "attestor not set");
            require!(
                self.blockchain().get_caller() == self.attestor().get(),
                "only attestor"
            );
        }

        self.nullifiers(&nullifier).set(true);
        let n = self.verified_count().get() + 1;
        self.verified_count().set(n);

        self.verify_event(n, &subject, &nullifier, &claim_type, epoch, scheme);
        true
    }

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
        let (pmin, pmax) = self.proof_bounds(scheme);
        let plen = proof.len();
        if plen < pmin || plen > pmax || plen > PROOF_HARD_MAX {
            return false;
        }
        if commitment.len() != COMMITMENT_LEN {
            return false;
        }
        if nullifier.len() < NULLIFIER_MIN || nullifier.len() > NULLIFIER_MAX {
            return false;
        }
        if self.nullifiers(&nullifier).get() {
            return false;
        }
        true
    }

    #[view(getProofBounds)]
    fn get_proof_bounds(&self) -> MultiValue2<u32, u32> {
        let scheme = self.scheme().get();
        let (a, b) = self.proof_bounds(scheme);
        (a as u32, b as u32).into()
    }

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
