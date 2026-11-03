import type { DomainId, EraId, TopicId } from "./taxonomy";

export type ThemeId = "art" | "heritage" | "nature" | "books" | "science" | "food" | "walk";
export type Setting = "indoor" | "outdoor" | "mixed";
export type Booking = "required" | "recommended" | "none" | "unknown";

export type SourceKind = "news" | "gov" | "reddit" | "blog" | "osm" | "community" | "guide" | "model" | "editorial";

/** Where a fact came from. `date` is when the source published (YYYY-MM or YYYY-MM-DD), null when unknown. */
export interface Source {
  kind: SourceKind;
  name: string;
  url?: string;
  date: string | null;
  note?: string;
}

export interface NextGlance {
  name: string;
  note: string;
}

export type ExclusionReason = "commercial" | "locals-avoid" | "inaccessible" | "seasonal" | "outdated" | "not-for-us";

/** One curated entry in the Library. Coordinates are GCJ-02 (see docs/adr/0003). */
export interface Place {
  id: string;
  name: string;
  area: string;
  /** The Area this Place belongs to (src/data/areas.json). */
  areaId: string;
  /** The kind of venue (美术馆, 书店…); colours the slip. What it teaches is in `topics`. */
  themes: ThemeId[];
  topics: TopicId[];
  /** Only the Eras the Place visibly carries; left out when unsure. */
  eras?: EraId[];
  setting: Setting;
  hours: number;
  lat: number;
  lng: number;
  localReason: string;
  kid9: string;
  kid16: string;
  december?: string;
  booking: Booking;
  /** ISO date of the last Verification, or null when Unverified. */
  verifiedAt: string | null;
  hook?: string;
  vibeTags?: string[];
  bestVisitWindow?: string;
  avoidWindow?: string;
  antiSignals?: string[];
  nextGlance?: NextGlance;
  sources: Source[];
}

export type FragmentTier = "fragment" | "weak" | "anti";

/** An unprocessed or low-confidence piece of the Clue Pool, gathered at research time with its Sources. */
export interface Fragment {
  id: string;
  tier: FragmentTier;
  text: string;
  area: string;
  themes?: ThemeId[];
  lat?: number;
  lng?: number;
  coordsApprox?: boolean;
  relatedPlaceId?: string;
  weakReason?: string;
  antiReason?: ExclusionReason;
  antiSignals?: string[];
  sources: Source[];
}

export interface Base {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export type TimeBudget = "2h" | "half" | "day";

export interface Conditions {
  time: TimeBudget;
  /** Max straight-line km from Base; null = any distance. */
  maxKm: number | null;
  rainSafe: boolean;
  /** Knowledge Domains the family wants today; empty means any. */
  domains: DomainId[];
}

export type MarkState = "clue" | "shortlist" | "punched" | "revisit" | "dismissed";

export interface Mark {
  state: MarkState;
  /** Trip Day (YYYY-MM-DD) for a Punch; kept when a Punch becomes Revisit. */
  day?: string;
  /** Why a Place or Fragment was Excluded. */
  reason?: ExclusionReason;
}

export interface Pass {
  version: 1;
  trip: { start: string; end: string };
  baseId: string;
  /** Set when the Base came from "use my location". */
  customBase?: Base;
  marks: Record<string, Mark>;
  conditions: Conditions;
  /** Observations by Quest id. Optional so Passes from before Phase 4 still load. */
  observations?: Record<string, Observation>;
  /** The owner's own check of Evidence against its source, by Evidence id. */
  reviews?: Record<string, Review>;
  /** 我的文化版图: how the family stands with each Culture. */
  cultures?: Record<string, CultureState>;
}

/** The owner read an Evidence's source on the phone: it matches ("ok") or something is wrong ("problem"). */
export interface Review {
  verdict: "ok" | "problem";
  on: string;
}

/** A stretch of city the Library and Quests are grouped by. Its position is derived from its Places and Quests, never stored. */
export interface Area {
  id: string;
  name: string;
  district: string;
  kind: "neighbourhood" | "corridor" | "district" | "town";
}

/**
 * One factual claim and where it comes from. `checkedAt` is set once the claim was read in a linked source;
 * `checkedBy` says whether that was the research assistant ("ai") or the owner ("owner").
 */
export interface Evidence {
  id: string;
  claim: string;
  sources: Source[];
  checkedAt: string | null;
  checkedBy?: "ai" | "owner";
  /** The claim describes a current state (open, closed, in use, renovating, a count) that can change; only these go stale. */
  volatile?: boolean;
  /** Set when sources disagree; says how. */
  disputed?: string;
}

/** A question-led exploration on the ground: what to look at, and what would count as an answer. */
export interface Quest {
  id: string;
  question: string;
  why: string;
  /** Background paragraphs; each names the Evidence that backs it. */
  background: { text: string; evidence: string[] }[];
  /** Observation steps, in the order to do them. */
  tasks: string[];
  /** What the family should find on site that bears on the question. */
  lookFor: string[];
  further: string[];
  areaId: string;
  placeIds: string[];
  /** The public space the Quest covers when it is not one venue: "杨树浦路，从秦皇岛路到定海路". */
  scope?: string;
  /** Start point, GCJ-02. */
  lat: number;
  lng: number;
  coordsApprox?: boolean;
  topics: TopicId[];
  eras?: EraId[];
  minutes: number;
  setting: Setting;
  /** Needs daylight to see what the tasks ask for. */
  daylight: boolean;
  difficulty: 1 | 2 | 3;
  kid9: string;
  kid16: string;
  /** How to get there and whether it is step-free; null when unknown. */
  access: { transit: string; stepFree: boolean | null };
  evidence: string[];
  /** Set once every Evidence it cites is checked and the steps were read against them. */
  checkedAt: string | null;
}

/** An ordered walk through several Quests in one Area. */
export interface Trail {
  id: string;
  title: string;
  question: string;
  areaId: string;
  questIds: string[];
  minutes: number;
}

/** What the family noted and found while doing one Quest. Device-local: it lives in the Pass. */
export interface Observation {
  note: string;
  /** Indexes into the Quest's `lookFor` the family found on site. */
  found: number[];
  /** The day the family marked the Quest done; absent while it is still open. */
  doneOn?: string;
  /** ISO timestamp of the last change. */
  updatedAt: string;
}

// ── Shanghai Now（上海正在发生）─────────────────────────────────────────────

/** How the family stands with a Culture: 想试 / 试过 / 喜欢. Device-local, in the Pass. */
export type CultureState = "want" | "tried" | "love";

/** A long-standing kind of contemporary culture (脱口秀, Livehouse, 古着…), with a first-time guide. Editable data, not a fixed list. */
export interface Culture {
  id: string;
  label: string;
  /** Two to four characters, for tags. */
  short: string;
  /** What it is, in plain words. Editorial, general knowledge; Shanghai-specific claims go in `facts`. */
  summary: string;
  firstTime: { expect: string[]; etiquette: string[]; start: string };
  kid9: string;
  kid16: string;
  /** Neighbouring Cultures for 兴趣扩散, each with why they connect. */
  adjacent: { id: string; why: string }[];
  /** Knowledge Topics it shares with the city-history side, for links both ways. */
  topics: TopicId[];
  questIds: string[];
  placeIds: string[];
  facts: { text: string; sources: Source[] }[];
  /** What we looked for and could not source, said plainly. */
  gap?: string;
  /** Set when this Culture was folded into another; links follow it. */
  mergedInto?: string;
}

/** business: shops, bars, clubs; institution: museums, theatres, malls; public: parks, paths; project: festivals, races, fashion weeks. */
export type VenueKind = "business" | "institution" | "public" | "project";

/** A real place or long-running programme where a Culture happens. `lastSeen` is the newest source showing it active. */
export interface Venue {
  id: string;
  name: string;
  kind: VenueKind;
  cultureIds: string[];
  area: string;
  status: "seen-active" | "unconfirmed" | "closed";
  lastSeen: string | null;
  note: string;
  ageNote?: string;
  placeId?: string;
  questIds?: string[];
  /**
   * GCJ-02, always approximate. place: copied from a Library Place or Quest; poi: OSM geocoding of the venue or its
   * building, converted from WGS-84; street: only the street it is on. Absent when nothing reliable was found.
   */
  geo?: { lat: number; lng: number; precision: "place" | "poi" | "street"; via: string };
  sources: Source[];
}

/** One dated happening. A weekly one carries `weekly` (0 = Sunday) and `validUntil`, after which it needs re-confirming. */
export interface CultureEvent {
  id: string;
  title: string;
  cultureIds: string[];
  venueId?: string;
  where?: string;
  start: string;
  end: string | null;
  status: "confirmed" | "unconfirmed" | "cancelled" | "ended";
  checkedAt: string | null;
  checkedBy?: "ai" | "owner";
  sources: Source[];
  note: string;
  weekly?: number[];
  validUntil?: string;
  /** "month" when the source names only the month: `start`/`end` then span it, and the Event stays 待确认. */
  datePrecision?: "day" | "month";
  /** Only when a source states it. */
  price?: { free: boolean; source: Source };
}

/** Something warming up now, kept apart from long-standing Cultures. Its heat comes from its Sources, never from exposure counts. */
export interface Trend {
  id: string;
  title: string;
  summary: string;
  cultureIds: string[];
  firstSeen: string;
  sources: Source[];
  /** What to look at on site to judge it yourself. */
  watch: string;
}
