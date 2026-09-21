import assert from "node:assert/strict";
import { chooseSubscriberUpdate, type RankedCandidate } from "./rerank_service.ts";

const results: RankedCandidate[] = [
  { id: "bundle", title: "Clinical icon bundle", description: "SVG assets", score: 0.64 },
  { id: "newsletter", title: "Privacy-first launch notes", description: "Subscriber update", score: 0.82 }
];

assert.equal(chooseSubscriberUpdate(results)?.id, "newsletter");
assert.equal(chooseSubscriberUpdate([{ ...results[0], score: 0.69 }]), undefined);
console.log("rerank decision test passed");
