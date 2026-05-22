"""
UniversalExecutor — Classe de base commune pour LIAExecutorTP1, TP3, TP5.
Contient la logique d'exécution xExchange 2-hop partagée.
"""
import base64
import json
import os
import time
import urllib.error
import urllib.request
from typing import Any

from vellum.workflows import BaseNode

WALLET = "erd1p4zyy5476u5nkw4hprhk6dh63znvksm4ppkxglxqasz2kum0lerqu0crn6"
MVX_API = "https://api.multiversx.com"
USDC_TOKEN = "USDC-c76f1f"
WEGLD_TOKEN = "WEGLD-bd4d79"
USDC_WEGLD_PAIR = "erd1qqqqqqqqqqqqqpgqeel2kumf0r8ffyhth7pqdujjat9nx0862jpsg2pqaq"


class UniversalExecutor(BaseNode):
    gas_limit_swap: int = 60000000
    gas_price: int = 1000000000
    chain_id: str = "1"
    tx_delay: int = 8
    min_trade_usd: float = 0.05
    slippage: float = 0.03
    nonce_delay: int = 2
    usdc_token_id: str = USDC_TOKEN
    wegld_token_id: str = WEGLD_TOKEN
    usdc_wegld_pair: str = USDC_WEGLD_PAIR

    class Outputs(BaseNode.Outputs):
        strategy: str
        executed: bool
        actions_executed: list[dict[str, Any]]
        total_bought_usd: float
        total_sold_usd: float
        actions_taken: list[str]
        execution_summary: str

    class Display(BaseNode.Display):
        icon = "vellum:icon:play"
        color = "grass"

    def run(self) -> "UniversalExecutor.Outputs":
        strategy = str(getattr(self, "strategy", "UNIVERSAL") or "UNIVERSAL")
        decision = str(getattr(self, "decision", "WAIT") or "WAIT")
        actions = list(getattr(self, "actions", []) or [])
        exit_actions = list(getattr(self, "exit_actions", []) or [])
        allocated_budget = float(getattr(self, "allocated_budget_usd", 0) or 0)
        return self._execute_cycle(strategy=strategy, decision=decision, actions=actions, exit_actions=exit_actions, allocated_budget=allocated_budget)

    def _execute_cycle(self, strategy, decision, actions, exit_actions, allocated_budget) -> "UniversalExecutor.Outputs":
        self._log("INFO", f"⚡ [{strategy}] {decision} | Budget=${allocated_budget:.4f}")
        if decision == "WAIT" and not exit_actions:
            return self._empty_output(strategy, "WAIT")
        if allocated_budget < self.min_trade_usd and not exit_actions:
            return self._empty_output(strategy, f"Budget ${allocated_budget:.4f} < ${self.min_trade_usd} min")
        pk_raw = os.getenv("MVX_PRIVATE_KEY", "")
        if not pk_raw:
            return self._empty_output(strategy, "NO_PRIVATE_KEY")
        actions_executed, actions_taken = [], []
        total_bought = total_sold = 0.0
        for action in exit_actions:
            amount = float(action.get("amount_usd", 0))
            if amount < self.min_trade_usd:
                continue
            result = self._simulate_or_execute(action, pk_raw, is_sell=True)
            actions_executed.append(result)
            if result.get("success"):
                total_sold += amount
                actions_taken.append(f"✅ {action.get('type', '')} ${amount:.2f}")
            else:
                actions_taken.append(f"❌ {action.get('type', '')} ÉCHOUÉ: {result.get('error', '')[:40]}")
            time.sleep(self.nonce_delay)
        for action in actions:
            amount = float(action.get("amount_usd", 0))
            if amount < self.min_trade_usd:
                continue
            result = self._simulate_or_execute(action, pk_raw, is_sell=False)
            actions_executed.append(result)
            if result.get("success"):
                total_bought += amount
                actions_taken.append(f"✅ {action.get('type', '')} ${amount:.2f}")
            else:
                actions_taken.append(f"❌ {action.get('type', '')} ÉCHOUÉ: {result.get('error', '')[:40]}")
            time.sleep(self.nonce_delay)
        executed = any(a.get("success") for a in actions_executed)
        summary = f"{strategy} | {decision} | Bought=${total_bought:.2f} | Sold=${total_sold:.2f} | {len(actions_taken)} actions"
        self._log("INFO", f"⚡ [{strategy}] {summary}")
        return self.Outputs(strategy=strategy, executed=executed, actions_executed=actions_executed, total_bought_usd=round(total_bought, 2), total_sold_usd=round(total_sold, 2), actions_taken=actions_taken, execution_summary=summary)

    def _simulate_or_execute(self, action, pk_raw, is_sell) -> dict:
        amount_usd = float(action.get("amount_usd", 0))
        token_id = action.get("token_id", "")
        pair_address = action.get("pair_address", "")
        if not token_id or not pair_address:
            return {"success": False, "error": f"token_id ou pair_address manquant", "amount_usd": 0}
        try:
            from multiversx_sdk import Address, Transaction, TransactionComputer, UserSecretKey, UserSigner
            signer = self._init_signer(pk_raw, UserSigner, UserSecretKey)
        except Exception as e:
            return {"success": False, "error": f"Signer: {str(e)[:60]}", "amount_usd": 0}
        try:
            egld_price = 4.5
            nonce = self._fresh_nonce()
            if not is_sell:
                usdc_raw = int(amount_usd * 1_000_000)
                min_wegld = int(amount_usd / egld_price * (1 - self.slippage) * 1e18)
                data1 = f"ESDTTransfer@{self._sh(self.usdc_token_id)}@{self._h(usdc_raw)}@{self._sh('swapTokensFixedInput')}@{self._sh(self.wegld_token_id)}@{self._h(min_wegld) if min_wegld > 0 else '01'}"
                r1 = self._sign_send(signer, self.usdc_wegld_pair, data1, nonce, self.gas_limit_swap)
                if not r1.get("success"):
                    return {"success": False, "error": f"Step1: {r1.get('error', '')[:60]}", "amount_usd": 0}
                s1, e1 = self._wait_confirm(r1["tx_hash"])
                if s1 != "success":
                    return {"success": False, "error": f"Step1 non confirmé: {e1}", "amount_usd": 0}
                time.sleep(self.tx_delay)
                nonce2 = self._fresh_nonce()
                wegld_bal = self._get_token_balance(self.wegld_token_id, 18)
                if wegld_bal <= 0.0001:
                    return {"success": False, "error": f"WEGLD insuffisant: {wegld_bal:.6f}", "amount_usd": 0}
                data2 = f"ESDTTransfer@{self._sh(self.wegld_token_id)}@{self._h(int(wegld_bal * 1e18))}@{self._sh('swapTokensFixedInput')}@{self._sh(token_id)}@01"
                r2 = self._sign_send(signer, pair_address, data2, nonce2, self.gas_limit_swap)
                if not r2.get("success"):
                    return {"success": False, "error": f"Step2: {r2.get('error', '')[:60]}", "amount_usd": 0}
                s2, e2 = self._wait_confirm(r2["tx_hash"])
                return {"success": s2 == "success", "tx_hash": r2["tx_hash"], "amount_usd": amount_usd, "error": e2 if s2 != "success" else ""}
            else:
                amount_raw = int(amount_usd * 1e18)
                if amount_raw == 0:
                    return {"success": False, "error": "Quantité trop petite", "amount_usd": 0}
                data1 = f"ESDTTransfer@{self._sh(token_id)}@{self._h(amount_raw)}@{self._sh('swapTokensFixedInput')}@{self._sh(self.wegld_token_id)}@01"
                r1 = self._sign_send(signer, pair_address, data1, nonce, self.gas_limit_swap)
                if not r1.get("success"):
                    return {"success": False, "error": f"Step1: {r1.get('error', '')[:60]}", "amount_usd": 0}
                s1, e1 = self._wait_confirm(r1["tx_hash"])
                if s1 != "success":
                    return {"success": False, "error": f"Step1 non confirmé: {e1}", "amount_usd": 0}
                time.sleep(self.tx_delay)
                nonce2 = self._fresh_nonce()
                wegld_bal = self._get_token_balance(self.wegld_token_id, 18)
                min_usdc = int(wegld_bal * egld_price * (1 - self.slippage) * 1_000_000)
                data2 = f"ESDTTransfer@{self._sh(self.wegld_token_id)}@{self._h(int(wegld_bal * 1e18))}@{self._sh('swapTokensFixedInput')}@{self._sh(self.usdc_token_id)}@{self._h(min_usdc) if min_usdc > 0 else '01'}"
                r2 = self._sign_send(signer, self.usdc_wegld_pair, data2, nonce2, self.gas_limit_swap)
                if not r2.get("success"):
                    return {"success": False, "error": f"Step2: {r2.get('error', '')[:60]}", "amount_usd": 0}
                s2, e2 = self._wait_confirm(r2["tx_hash"])
                return {"success": s2 == "success", "tx_hash": r2["tx_hash"], "amount_usd": amount_usd, "error": e2 if s2 != "success" else ""}
        except Exception as e:
            return {"success": False, "error": str(e)[:100], "amount_usd": 0}

    def _sign_send(self, signer, receiver, data_str, nonce, gas_limit) -> dict:
        try:
            from multiversx_sdk import Address, Transaction, TransactionComputer
            wallet_address = str(getattr(self, "wallet_address", WALLET) or WALLET)
            tx = Transaction(nonce=nonce, value=0, sender=Address.new_from_bech32(wallet_address), receiver=Address.new_from_bech32(receiver), gas_price=self.gas_price, gas_limit=gas_limit, data=data_str.encode(), chain_id=self.chain_id, version=1)
            tc = TransactionComputer()
            tx.signature = signer.sign(tc.compute_bytes_for_signing(tx))
            payload = {"nonce": tx.nonce, "value": str(tx.value), "receiver": receiver, "sender": wallet_address, "gasPrice": tx.gas_price, "gasLimit": tx.gas_limit, "data": base64.b64encode(tx.data).decode(), "signature": tx.signature.hex(), "chainID": tx.chain_id, "version": tx.version}
            req = urllib.request.Request(f"{MVX_API}/transactions", data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req, timeout=30) as resp:
                return {"success": True, "tx_hash": json.loads(resp.read().decode()).get("txHash", "")}
        except urllib.error.HTTPError as e:
            return {"success": False, "error": e.read().decode()[:200]}
        except Exception as e:
            return {"success": False, "error": str(e)[:100]}

    def _wait_confirm(self, tx_hash, max_checks=40):
        for _ in range(max_checks):
            time.sleep(3)
            try:
                req = urllib.request.Request(f"{MVX_API}/transactions/{tx_hash}?withResults=true", headers={"User-Agent": "LIA-UniversalExecutor/6.0"})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = json.loads(resp.read().decode())
                    status = data.get("status", "pending")
                    if status == "success":
                        return ("success", "")
                    if status in ("fail", "invalid"):
                        errors = [r["returnMessage"] for r in data.get("results", []) if r.get("returnMessage")]
                        return (status, " | ".join(errors[:2]) or status)
            except Exception:
                pass
        return ("timeout", "Timeout 120s")

    def _fresh_nonce(self):
        wallet_address = str(getattr(self, "wallet_address", WALLET) or WALLET)
        try:
            req = urllib.request.Request(f"{MVX_API}/accounts/{wallet_address}", headers={"User-Agent": "LIA-UniversalExecutor/6.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                return json.loads(resp.read().decode()).get("nonce", 0)
        except Exception:
            return int(getattr(self, "nonce", 0) or 0)

    def _get_token_balance(self, token_id, decimals):
        wallet_address = str(getattr(self, "wallet_address", WALLET) or WALLET)
        try:
            req = urllib.request.Request(f"{MVX_API}/accounts/{wallet_address}/tokens/{token_id}", headers={"User-Agent": "LIA-UniversalExecutor/6.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                return float(json.loads(resp.read().decode()).get("balance", "0")) / 10**decimals
        except Exception:
            return 0.0

    def _init_signer(self, pk_raw, UserSigner, UserSecretKey):
        content = pk_raw.strip()
        hex_kp = None
        if "-----BEGIN" in content:
            lines, b64_parts, in_k = content.split("\n"), [], False
            for line in lines:
                line = line.strip()
                if "-----BEGIN" in line:
                    in_k = True
                    continue
                if "-----END" in line:
                    break
                if in_k and line:
                    b64_parts.append(line)
            decoded = base64.b64decode("".join(b64_parts))
            try:
                hex_kp = decoded.decode("utf-8").strip()
            except Exception:
                hex_kp = decoded.hex()
        else:
            try:
                decoded = base64.b64decode(content)
                try:
                    hex_kp = decoded.decode("utf-8").strip()
                except Exception:
                    hex_kp = decoded.hex()
            except Exception:
                hex_kp = content
        hex_kp = "".join(c for c in hex_kp.lower().strip() if c in "0123456789abcdef")
        if len(hex_kp) == 128:
            return UserSigner(UserSecretKey(bytes.fromhex(hex_kp[:64])))
        elif len(hex_kp) == 64:
            return UserSigner(UserSecretKey(bytes.fromhex(hex_kp)))
        raise ValueError(f"Invalid key length: {len(hex_kp)}")

    def _empty_output(self, strategy, reason):
        self._log("INFO", f"⏸️ [{strategy}] Skip: {reason}")
        return self.Outputs(strategy=strategy, executed=False, actions_executed=[], total_bought_usd=0.0, total_sold_usd=0.0, actions_taken=[], execution_summary=f"Skip: {reason}")

    def _h(self, v):
        if v == 0:
            return "00"
        h = hex(v)[2:]
        return h if len(h) % 2 == 0 else "0" + h

    def _sh(self, t):
        return t.encode("utf-8").hex()

    def _log(self, severity, message):
        self._context.emit_log_event(severity=severity, message=message)
