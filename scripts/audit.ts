// Pre-trip knowledge audit. Run: npm run audit [-- --pass exported-pass.json] [-- --out docs/audit.md]
// `--pass` takes the text from 我的月票 → 导出 so your on-phone reviews count.
import { readFileSync, writeFileSync } from "node:fs";
import { auditKnowledge, auditMarkdown, auditNow, auditNowMarkdown } from "../src/domain/audit";
import type { Culture, CultureEvent, Evidence, Pass, Place, Quest, Trend, Venue } from "../src/domain/types";
import cultures from "../src/data/now/cultures.json";
import nowEvents from "../src/data/now/events.json";
import trends from "../src/data/now/trends.json";
import venues from "../src/data/now/venues.json";
import evidence from "../src/data/evidence.json";
import places from "../src/data/places.json";
import quests from "../src/data/quests.json";

const arg = (name: string) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const passFile = arg("--pass");
const pass = passFile ? (JSON.parse(readFileSync(passFile, "utf8")) as Pass) : undefined;
const today = new Date().toISOString().slice(0, 10);
const report = auditMarkdown(
  auditKnowledge({ quests: quests as Quest[], evidence: evidence as Evidence[], places: places as Place[] }, today, pass?.reviews),
  today,
) + "\n" + auditNowMarkdown(auditNow({ cultures: cultures as Culture[], venues: venues as Venue[], events: nowEvents as CultureEvent[], trends: trends as Trend[] }, today));
const out = arg("--out");
if (out) writeFileSync(out, report + "\n");
else console.log(report);
