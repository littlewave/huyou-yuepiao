import { describe, expect, it } from "vitest";
import { eventState } from "../domain/now";
import type { Culture, CultureEvent, Place, Quest, Trend, Venue } from "../domain/types";
import { isTopic } from "../domain/taxonomy";
import cultureRaw from "./now/cultures.json";
import eventRaw from "./now/events.json";
import trendRaw from "./now/trends.json";
import venueRaw from "./now/venues.json";
import placeRaw from "./places.json";
import questRaw from "./quests.json";

const cultures = cultureRaw as Culture[];
const venues = venueRaw as Venue[];
const events = eventRaw as CultureEvent[];
const trends = trendRaw as Trend[];
const cultureIds = new Set(cultures.map((c) => c.id));
const venueIds = new Set(venues.map((v) => v.id));
const questIds = new Set((questRaw as Quest[]).map((q) => q.id));
const placeIds = new Set((placeRaw as Place[]).map((p) => p.id));
const LINKED = new Set(["news", "gov", "reddit", "blog", "osm", "community", "guide"]);
const linked = (s: { kind: string; url?: string }) => !LINKED.has(s.kind) || s.url?.startsWith("https://");

// Shanghai Now is never invented: every Venue, Event, Trend and fact carries a real link,
// every reference resolves, and nothing past is offered as current.
describe("Shanghai Now data", () => {
  it("has 16 Cultures with unique ids, first-time guides and at least one sourced fact", () => {
    expect(cultures).toHaveLength(16);
    expect(cultureIds.size).toBe(cultures.length);
    for (const c of cultures) {
      expect(c.firstTime.start.length, c.id).toBeGreaterThan(5);
      expect(c.short.length, c.id).toBeLessThanOrEqual(4);
      expect(c.facts.length, c.id).toBeGreaterThan(0);
      for (const f of c.facts) for (const s of f.sources) expect(linked(s), `${c.id}: ${s.name}`).toBe(true);
      for (const a of c.adjacent) expect(cultureIds.has(a.id), `${c.id} → ${a.id}`).toBe(true);
      for (const t of c.topics) expect(isTopic(t), t).toBe(true);
      for (const q of c.questIds) expect(questIds.has(q), q).toBe(true);
      for (const p of c.placeIds) expect(placeIds.has(p), p).toBe(true);
      if (c.mergedInto) expect(cultureIds.has(c.mergedInto)).toBe(true);
    }
  });

  it("every Venue is sourced and points at real Cultures, Places and Quests", () => {
    expect(venueIds.size).toBe(venues.length);
    for (const v of venues) {
      expect(v.sources.length, v.id).toBeGreaterThan(0);
      for (const s of v.sources) expect(linked(s), `${v.id}: ${s.name}`).toBe(true);
      for (const c of v.cultureIds) expect(cultureIds.has(c), `${v.id}: ${c}`).toBe(true);
      if (v.placeId) expect(placeIds.has(v.placeId), v.placeId).toBe(true);
      for (const q of v.questIds ?? []) expect(questIds.has(q), q).toBe(true);
      if (v.geo) {
        expect(v.geo.lat, v.id).toBeGreaterThan(30.6);
        expect(v.geo.lat, v.id).toBeLessThan(31.9);
        expect(v.geo.lng, v.id).toBeGreaterThan(120.8);
        expect(v.geo.lng, v.id).toBeLessThan(122.1);
        expect(v.geo.via.length, v.id).toBeGreaterThan(0);
      }
    }
  });

  it("every Event is sourced, dated sensibly, states a price only with a source, and never hides that it ended", () => {
    for (const e of events) {
      expect(e.sources.length, e.id).toBeGreaterThan(0);
      for (const s of e.sources) expect(linked(s), e.id).toBe(true);
      if (e.venueId) expect(venueIds.has(e.venueId), e.venueId).toBe(true);
      if (e.end) expect(e.end >= e.start, e.id).toBe(true);
      if (e.weekly) expect(e.validUntil, `${e.id} needs validUntil`).toBeTruthy();
      // A month-only date can't be confirmed.
      if (e.datePrecision === "month") expect(e.status, e.id).toBe("unconfirmed");
      if (e.price) expect(linked(e.price.source)).toBe(true);
      for (const c of e.cultureIds) expect(cultureIds.has(c)).toBe(true);
    }
    // Recorded as ended → never listed, whatever today is.
    for (const e of events.filter((x) => x.status === "ended")) expect(eventState(e, "2000-01-01")).toBe("ended");
  });

  it("every Trend rests on sources and names real Cultures", () => {
    for (const t of trends) {
      expect(t.sources.length, t.id).toBeGreaterThan(0);
      for (const s of t.sources) expect(linked(s)).toBe(true);
      for (const c of t.cultureIds) expect(cultureIds.has(c)).toBe(true);
    }
  });
});
