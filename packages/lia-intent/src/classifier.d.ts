export interface ClassifierPack {
  tier: "pulse" | "yield" | "sentinel";
  amountEur: "110" | "75" | "50";
  amountCents: number;
  cap: number;
}

export interface ClassifierResult {
  ok: boolean;
  schema: "xartists.lia.classifier.v1";
  disposition: "read" | "paper_quote" | "refuse" | "clarify";
  intent: "NAVIGATE" | "BUY_PACK" | "STATUS" | "REFUSE" | "CLARIFY";
  executable: false;
  payable: false;
  paperMode: true;
  liveTrading: false;
  confidence: number;
  route: string | null;
  pack: ClassifierPack | null;
  reason: string;
  clarify: string | null;
  signals: string[];
}

export const classifierCatalogue: {
  pulse: ClassifierPack;
  yield: ClassifierPack;
  sentinel: ClassifierPack;
};

export function classifyUtterance(raw: string): ClassifierResult;
