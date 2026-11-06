import copy
import hashlib
import unittest
from lia.memory.anchor_proofs import (ZERO_ROOT,anchor_candidate,hash_leaf,
    merkle_root,membership_proof,verify_membership)


def sample(i: int) -> dict:
    digest=lambda label: hashlib.sha256((label+str(i)).encode()).hexdigest()
    return {"v":1,"kind":"rights","network":"offchain","subject_digest":digest('subject'),
        "source_digest":digest('source'),"content_digest":digest('content'),"source_at_ms":1700000000000+i}


class AnchorProofTests(unittest.TestCase):
    def test_single_event_root_is_leaf(self):
        self.assertEqual(merkle_root([sample(1)]),hash_leaf(sample(1)))
        self.assertTrue(verify_membership(sample(1),membership_proof([sample(1)],0),merkle_root([sample(1)])))

    def test_odd_event_count_and_full_proof(self):
        events=[sample(i) for i in range(5)]
        root=merkle_root(events)
        for i,e in enumerate(events):
            self.assertTrue(verify_membership(e,membership_proof(events,i),root))

    def test_modified_event_does_not_validate(self):
        events=[sample(i) for i in range(5)]
        forged=sample(3);forged['content_digest']='a'*64
        self.assertFalse(verify_membership(forged,membership_proof(events,3),merkle_root(events)))

    def test_bad_proof_and_wrong_root_rejected(self):
        events=[sample(i) for i in range(4)]
        proof=membership_proof(events,2)
        bad=copy.deepcopy(proof);bad['path'][0]['sibling']='b'*64
        self.assertFalse(verify_membership(events[2],bad,merkle_root(events)))
        self.assertFalse(verify_membership(events[2],proof,'b'*64))

    def test_proof_path_cannot_claim_other_index_or_skip_step(self):
        events=[sample(i) for i in range(5)]
        proof=membership_proof(events,4);proof['index']=0
        self.assertFalse(verify_membership(events[4],proof,merkle_root(events)))
        proof=membership_proof(events,4);proof['path'].pop()
        self.assertFalse(verify_membership(events[4],proof,merkle_root(events)))

    def test_batch_is_order_sensitive_and_deduplicated(self):
        a,b=sample(1),sample(2)
        self.assertNotEqual(merkle_root([a,b]),merkle_root([b,a]))
        with self.assertRaises(ValueError):merkle_root([a,a])

    def test_private_data_fields_and_invalid_payloads_rejected(self):
        bad=sample(1);bad['email']='private@example.com'
        with self.assertRaises(ValueError):hash_leaf(bad)
        bad=sample(1);bad['content_digest']='private content'
        with self.assertRaises(ValueError):hash_leaf(bad)
        bad=sample(1);bad['source_at_ms']=True
        with self.assertRaises(ValueError):hash_leaf(bad)

    def test_empty_and_large_batch_rejected(self):
        with self.assertRaises(ValueError):merkle_root([])
        with self.assertRaises(ValueError):merkle_root([sample(i) for i in range(1025)])

    def test_candidate_unanchored_and_deterministic(self):
        a=anchor_candidate([sample(1),sample(2)],sequence=1)
        b=anchor_candidate([sample(1),sample(2)],sequence=1)
        self.assertEqual(a,b)
        self.assertEqual(a['state'],'unanchored')
        self.assertFalse(a['is_onchain_verified'])
        self.assertEqual(a['previous_root'],ZERO_ROOT)

    def test_wrong_anchor_network_or_previous_root_rejected(self):
        for kwargs in ({'sequence':0},{'sequence':1,'target_network':'offchain'},
                       {'sequence':1,'target_network':'ethereum-mainnet'},
                       {'sequence':1,'previous_root':'not-a-hash'}):
            with self.assertRaises(ValueError):anchor_candidate([sample(1)],**kwargs)


if __name__=='__main__':unittest.main()
