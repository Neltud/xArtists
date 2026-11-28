import assert from "node:assert/strict";
import test from "node:test";
import { planIntent, readAmount } from "./engine.mjs";

test("empty intent abstains and never authorizes execution", () => {
  const plan = planIntent("   ", 1);
  assert.equal(plan.verdict, "abstain");
  assert.equal(plan.executionAuthorized, false);
  assert.equal(plan.signingAuthorized, false);
});

test("french on-ramp stays paper and keeps fiat rails off", () => {
  const plan = planIntent("Achète 4 € d’EGLD", 2);
  assert.equal(plan.kind, "onramp");
  assert.equal(plan.verdict, "paper_plan");
  assert.equal(plan.amount, 4);
  assert.equal(plan.unit, "eur");
  assert.equal(plan.executionAuthorized, false);
  assert.ok(plan.rails.every((rail) => rail.state !== "paper" || rail.id === "unused"));
  assert.equal(plan.rails.find((rail) => rail.id === "moonpay")?.state, "off");
});

test("amount above the pilot cap is vetoed", () => {
  const plan = planIntent("Swap 40 USDC en EGLD", 3);
  assert.equal(plan.kind, "swap");
  assert.equal(plan.verdict, "veto");
  assert.equal(plan.guardian.stance, "VETO");
  assert.equal(plan.vault, "cold");
});

test("drain language is vetoed before any plan", () => {
  const plan = planIntent("Retire tout du wallet", 4);
  assert.equal(plan.verdict, "veto");
  assert.match(plan.guardian.reason, /extraction/i);
});

test("live signature request is vetoed", () => {
  const plan = planIntent("Signe maintenant le swap", 5);
  assert.equal(plan.verdict, "veto");
  assert.equal(plan.signingAuthorized, false);
});

test("stake, rebalance, listing and status classify without quotes", () => {
  assert.equal(planIntent("Staker 20 TRO").kind, "stake");
  assert.equal(planIntent("Rééquilibre le yield Hatom").kind, "rebalance");
  assert.equal(planIntent("Mettre en vente mon NFT").kind, "list_nft");
  assert.equal(planIntent("Statut des rails").kind, "status");
  assert.equal(planIntent("Pause d'urgence").kind, "circuit_breaker");
  assert.equal(planIntent("Pack Pulse").verdict, "paper_plan");
});

test("unknown language abstains", () => {
  const plan = planIntent("peins-moi une couleur");
  assert.equal(plan.kind, "abstain");
  assert.equal(plan.verdict, "abstain");
});

test("amount reader accepts french decimals", () => {
  assert.deepEqual(readAmount("acheter 4,5 euros"), { amount: 4.5, unit: "eur" });
});
