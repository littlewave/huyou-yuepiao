import { describe, expect, it } from "vitest";
import { checkGraph } from "../domain/graph";
import type { Area, Evidence, Place, Quest, Trail } from "../domain/types";
import areas from "./areas.json";
import evidence from "./evidence.json";
import places from "./places.json";
import quests from "./quests.json";
import trails from "./trails.json";

// Every id the knowledge graph points at exists, and every Quest stands on cited Evidence.
describe("knowledge graph", () => {
  it("is consistent", () => {
    expect(
      checkGraph({
        places: places as Place[],
        areas: areas as Area[],
        quests: quests as Quest[],
        trails: trails as Trail[],
        evidence: evidence as Evidence[],
      }),
    ).toEqual([]);
  });
});
