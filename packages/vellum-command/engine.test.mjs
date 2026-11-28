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

test("single explicit amounts support French/English decimal separators and spaces",()=>{
  for(const [text,amount,unit] of [
    ["Swap 4 USDC en EGLD",4,"usdc"],
    ["Acheter 4,50 euros",4.5,"eur"],
    ["Buy $4.50",4.5,"usd"],
    ["Acheter € 4,50",4.5,"eur"],
    ["Swap 0,125 EGLD en TRO",0.125,"egld"],
    ["Swap 1\u00a0000,50 USDC",1000.5,"usdc"],
    ["Acheter 1\u202f000 EUR",1000,"eur"],
    ["Stake 20 TRO",20,"tro"],
  ])assert.deepEqual(readAmount(text),{amount,unit},text);
});
test("ambiguous, unknown, multiple or non-positive values abstain",()=>{
  for(const text of [
    "Swap 4 USDT en EGLD","Swap 4 en EGLD","Swap 4,5 USDcoin",
    "Acheter 1,000 EUR","Buy 1.000 USD","Swap 1,000.50 USD",
    "Swap -4 USDC","Swap +4 USDC","Swap 0 USDC","Swap 1e3 USDC",
    "Swap 4 USDC et 3 EGLD","Swap 4 5 USDC","Acheter 4",
    "Swap USD 4 USDC","Swap 4..5 USDC","Swap USDC","Swap 4. USDC",
  ]){
    const p=planIntent(text);
    assert.equal(p.verdict,"abstain",text);
    assert.equal(p.executionAuthorized,false);
    assert.equal(p.signingAuthorized,false);
  }
});
test("nominal limits are independent per unit and never convert currencies",()=>{
  for(const [unit,below,above] of [["USD","5","5.01"],["EUR","5","5.01"],["USDC","5","5.01"],["EGLD","0.2","0.21"],["TRO","100","101"]]){
    const within=planIntent("Swap "+below+" "+unit);
    const over=planIntent("Swap "+above+" "+unit);
    assert.equal(within.verdict,"paper_plan",unit);
    assert.equal(over.verdict,"veto",unit);
    assert.match(over.capNote,new RegExp(unit));
    for(const plan of [within,over]){
      assert.equal(plan.executionAuthorized,false);
      assert.equal(plan.signingAuthorized,false);
    }
  }
});
test("read-only status does not invent a quote or live state",()=>{
 const p=planIntent("Status");
 assert.equal(p.verdict,"paper_plan");
 assert.match(p.summary,/ne constitue pas un état/);
 assert.equal(p.executionAuthorized,false);
 assert.equal(p.signingAuthorized,false);
});
