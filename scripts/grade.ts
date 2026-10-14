// Grades buildMockReport against Abdullah's answer key (data/test-shops.expected.json).
// Pass = overall in [lo, hi] and verdict matches. Target: 10/10.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildMockReport } from "../lib/scorer";
import type { ShopData } from "../lib/types";

interface Expected {
  profile: string;
  expectedOverallRange: [number, number];
  expectedVerdict: string;
  referenceDimensions: Record<string, number>;
  referenceOverall: number;
}

const shops: ShopData[] = JSON.parse(
  readFileSync(resolve(__dirname, "../data/test-shops.json"), "utf8"),
);
const expected: Record<string, Expected> = JSON.parse(
  readFileSync(resolve(__dirname, "../data/test-shops.expected.json"), "utf8"),
);

let pass = 0;
let fail = 0;

for (const shop of shops) {
  const exp = expected[shop.name];
  if (!exp) {
    console.log(`FAIL ${shop.name}: not in answer key`);
    fail++;
    continue;
  }
  const report = buildMockReport(shop);
  const [lo, hi] = exp.expectedOverallRange;
  const dimByShopKey = report.dimensions.map((d) => `${d.key}=${d.score}`).join(" ");

  const problems: string[] = [];
  if (report.overallScore < lo || report.overallScore > hi) {
    problems.push(`overall ${report.overallScore} not in [${lo},${hi}] (ref ${exp.referenceOverall})`);
  }
  if (report.verdict !== exp.expectedVerdict) {
    problems.push(`verdict ${report.verdict} != ${exp.expectedVerdict}`);
  }
  for (const d of report.dimensions) {
    const ref = exp.referenceDimensions[d.key];
    if (ref !== undefined && Math.abs(d.score - ref) > 1) {
      problems.push(`dim ${d.key}=${d.score} vs ref ${ref}`);
    }
  }

  if (problems.length === 0) {
    pass++;
    console.log(`PASS ${shop.name}: overall=${report.overallScore} verdict=${report.verdict} [${dimByShopKey}]`);
  } else {
    fail++;
    console.log(`FAIL ${shop.name}: overall=${report.overallScore} verdict=${report.verdict} [${dimByShopKey}]`);
    for (const p of problems) console.log(`     - ${p}`);
  }
}

console.log(`\n${pass}/${shops.length} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
