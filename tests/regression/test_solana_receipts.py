"""SOL receipt parser: offline adversarial fixtures. No RPC, wallet, or funds."""
import unittest

from lia.xorus.solana_receipts import inspect_native_sol_receipt

ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"


def b58(data):
    n = int.from_bytes(data, "big")
    chars = ""
    while n:
        n, digit = divmod(n, 58)
        chars = ALPHABET[digit] + chars
    return "1" * (len(data) - len(data.lstrip(b"\x00"))) + chars


SENDER = b58(b"\x11" * 32)
RECIPIENT = b58(b"\x22" * 32)
OTHER = b58(b"\x44" * 32)
SIG = b58(b"\x33" * 64)


def fixture():
    return {"result": {
        "slot": 12345, "blockTime": 1800000000,
        "meta": {"err": None, "innerInstructions": [], "preBalances": [10000, 500],
                 "postBalances": [9000, 1500]},
        "transaction": {
            "signatures": [SIG],
            "message": {
                "accountKeys": [
                    {"pubkey": SENDER, "signer": True, "writable": True},
                    {"pubkey": RECIPIENT, "signer": False, "writable": True},
                ],
                "instructions": [{
                    "program": "system", "programId": "11111111111111111111111111111111",
                    "parsed": {"type": "transfer", "info": {
                        "source": SENDER, "destination": RECIPIENT, "lamports": 1000}},
                }],
            },
        },
    }}


class TestNativeSolReceipt(unittest.TestCase):
    def check(self, response, **kwargs):
        return inspect_native_sol_receipt(
            signature=SIG, recipient=RECIPIENT, rpc_response=response,
            minimum_lamports=1000, network="devnet", **kwargs,
        )

    def test_accept_observed_receipt_but_never_entitlement(self):
        result = self.check(fixture())
        self.assertEqual(result["status"], "observed_finalized_native_sol")
        self.assertEqual(result["lamports"], 1000)
        self.assertFalse(result["settlement_recorded"])
        self.assertFalse(result["paybox_control_verified"])
        self.assertFalse(result["can_execute"])

    def test_missing_unfinalized_and_rpc_error(self):
        for payload in ({"result": None}, {"error": {"code": -1}},
                        {}, {"result": []}):
            self.assertEqual(self.check(payload)["status"], "rejected")

    def test_failed_transaction_rejected(self):
        case = fixture()
        case["result"]["meta"]["err"] = {"InstructionError": [0, "Custom"]}
        self.assertEqual(self.check(case)["status"], "rejected")

    def test_wrong_destination_and_wrong_signer_rejected(self):
        for field, value in (("destination", OTHER), ("source", RECIPIENT)):
            case = fixture()
            case["result"]["transaction"]["message"]["instructions"][0]["parsed"]["info"][field] = value
            self.assertEqual(self.check(case)["status"], "rejected")
        case = fixture()
        case["result"]["transaction"]["message"]["accountKeys"][0]["signer"] = False
        self.assertEqual(self.check(case)["reason"], "sender_not_signer")

    def test_signature_and_balance_mismatches_rejected(self):
        case = fixture()
        case["result"]["transaction"]["signatures"] = [b58(b"\x55" * 64)]
        self.assertEqual(self.check(case)["reason"], "signature_mismatch")
        case = fixture()
        case["result"]["meta"]["postBalances"][1] = 1499
        self.assertEqual(self.check(case)["reason"], "balance_delta_mismatch")

    def test_unsafe_extra_instructions_and_inner_instructions_rejected(self):
        case = fixture()
        case["result"]["transaction"]["message"]["instructions"].append(
            {"program": "spl-token", "programId": OTHER})
        self.assertEqual(self.check(case)["reason"], "unexpected_program")
        case = fixture()
        case["result"]["meta"]["innerInstructions"] = [{"index": 0, "instructions": []}]
        self.assertEqual(self.check(case)["reason"], "failed_or_complex_transaction")

    def test_invalid_chain_identifiers_and_amounts_rejected(self):
        self.assertEqual(inspect_native_sol_receipt(
            signature=SIG, recipient=RECIPIENT, rpc_response=fixture(),
            network="devnet", minimum_lamports=1001)["status"], "rejected")
        self.assertEqual(inspect_native_sol_receipt(
            signature=SIG, recipient=RECIPIENT, rpc_response=fixture(),
            network="unknown", minimum_lamports=1000)["status"], "rejected")
        self.assertEqual(inspect_native_sol_receipt(
            signature=SIG, recipient="INVALID", rpc_response=fixture(),
            network="devnet", minimum_lamports=1000)["status"], "rejected")


if __name__ == "__main__":
    unittest.main()
