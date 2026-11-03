import { describe, expect, it } from "vitest";
import { culturesForQuest, diffuse, districtOf, eventState, eventsBetween, planDays, radar, resolveCulture, setCultureState, venueState } from "./now";
import { emptyPass } from "./pass";
import type { Culture, CultureEvent, Quest, Trend, Venue } from "./types";

const src = (name: string, date: string | null) => ({ kind: "news" as const, name, url: "https://x", date });
const culture = (id: string, over: Partial<Culture> = {}): Culture => ({
  id, label: id, short: id, summary: "", firstTime: { expect: [], etiquette: [], start: "" }, kid9: "", kid16: "",
  adjacent: [], topics: [], questIds: [], placeIds: [], facts: [], ...over,
});
const venue = (over: Partial<Venue>): Venue => ({
  id: "v", name: "V", kind: "business", cultureIds: ["music"], area: "徐汇 · 衡山路", status: "seen-active", lastSeen: "2026-03-07", note: "", sources: [], ...over,
});
const ev = (over: Partial<CultureEvent>): CultureEvent => ({
  id: "e", title: "E", cultureIds: ["music"], venueId: "v", start: "2026-12-12", end: "2026-12-20", status: "confirmed", checkedAt: "2026-11-03", sources: [], note: "", ...over,
});
const TODAY = "2026-11-03";

describe("venueState", () => {
  it("keeps closed closed, ages businesses out after 18 months, never ages public space", () => {
    expect(venueState(venue({ status: "closed" }), TODAY)).toBe("closed");
    expect(venueState(venue({}), TODAY)).toBe("active");
    expect(venueState(venue({ lastSeen: "2024-06-21" }), TODAY)).toBe("unconfirmed");
    expect(venueState(venue({ lastSeen: "2024-06-21", kind: "institution" }), TODAY)).toBe("active");
    expect(venueState(venue({ lastSeen: "2013-07-05", kind: "public" }), TODAY)).toBe("active");
    expect(venueState(venue({ status: "unconfirmed" }), TODAY)).toBe("unconfirmed");
  });
});

describe("events", () => {
  it("drop out once ended, and weekly ones turn 待确认 after validUntil", () => {
    expect(eventState(ev({ end: "2026-11-01" }), TODAY)).toBe("ended");
    expect(eventState(ev({ status: "ended", end: "2027-01-01" }), TODAY)).toBe("ended");
    expect(eventState(ev({}), TODAY)).toBe("upcoming");
    expect(eventState(ev({ checkedAt: null }), TODAY)).toBe("unconfirmed");
    expect(eventState(ev({ datePrecision: "month" }), TODAY)).toBe("unconfirmed");
    expect(eventState(ev({ weekly: [1], end: null, validUntil: "2026-09-07" }), TODAY)).toBe("unconfirmed");
    expect(eventState(ev({ weekly: [1], end: null, validUntil: "2027-01-01" }), TODAY)).toBe("ongoing");
  });

  it("lists what falls in a window, with every matching weekday for weekly events, and filters", () => {
    const vs = [venue({}), venue({ id: "w", area: "黄浦 · 南京东路" })];
    const list = [
      ev({ id: "musical" }),
      ev({ id: "past", start: "2026-10-01", end: "2026-10-31" }),
      ev({ id: "jam", start: "2026-03-07", end: null, weekly: [1], validUntil: "2027-01-01", venueId: "w" }),
      ev({ id: "free", start: "2026-12-06", end: "2026-12-06", price: { free: true, source: src("S", "2026-04") } }),
    ];
    const r = eventsBetween(list, vs, "2026-12-01", "2026-12-14", TODAY);
    expect(r.map((x) => x.event.id)).toEqual(["free", "jam", "musical"]);
    expect(r[1]!.days).toEqual(["2026-12-07", "2026-12-14"]); // Mondays
    expect(eventsBetween(list, vs, "2026-12-01", "2026-12-14", TODAY, { district: "黄浦" }).map((x) => x.event.id)).toEqual(["jam"]);
    expect(eventsBetween(list, vs, "2026-12-01", "2026-12-14", TODAY, { freeOnly: true }).map((x) => x.event.id)).toEqual(["free"]);
    const withMonth = [...list, ev({ id: "sometime", start: "2026-12-01", end: "2026-12-31", datePrecision: "month", status: "unconfirmed" })];
    expect(eventsBetween(withMonth, vs, "2026-12-01", "2026-12-14", TODAY).map((x) => x.event.id).at(-1)).toBe("sometime");
    expect(districtOf("靠近外滩（来源未给门牌）")).toBe("");
  });
});

describe("cultures", () => {
  const cs = [
    culture("comedy", { adjacent: [{ id: "theatre", why: "即兴" }, { id: "games", why: "互动" }] }),
    culture("music", { adjacent: [{ id: "theatre", why: "音乐剧" }, { id: "old-night", why: "爵士吧" }] }),
    culture("theatre", { adjacent: [{ id: "comedy", why: "小剧场" }] }),
    culture("games"),
    culture("old-night", { mergedInto: "night" }),
    culture("night"),
  ];

  it("follows merges", () => {
    expect(resolveCulture("old-night", cs)!.id).toBe("night");
    expect(resolveCulture("nope", cs)).toBeUndefined();
  });

  it("spreads interest to neighbours, through merges, skipping what is tried, loves weighing double", () => {
    const r = diffuse(cs, { music: "love", comedy: "tried", games: "tried" });
    expect(r.map((x) => x.culture.id)).toEqual(["theatre", "night"]);
    expect(r[0]!.via.map((v) => v.from.id)).toEqual(["music", "comedy"]);
    expect(diffuse(cs, {}, ["comedy"]).map((x) => x.culture.id)).toEqual(["theatre", "games"]);
  });

  it("ranks the radar: Cultures with a Trend first, then by recent independent evidence", () => {
    const trend: Trend = { id: "t", title: "", summary: "", cultureIds: ["games"], firstSeen: "2025-01", sources: [src("A", "2025-06")], watch: "" };
    const withFacts = culture("music", { facts: [{ text: "", sources: [src("B", "2026-01"), src("C（转载）", "2026-02"), src("C", "2026-03")] }] });
    const rows = radar([culture("comedy"), withFacts, culture("games")], [], [], [trend], TODAY);
    expect(rows.map((r) => [r.culture.id, r.evidence])).toEqual([["games", 1], ["music", 2], ["comedy", 0]]);
  });

  it("links Quests and Cultures both ways", () => {
    const q = { id: "q", topics: ["culture/stage"] } as unknown as Quest;
    expect(culturesForQuest(q, [culture("a", { topics: ["culture/stage"] }), culture("b", { questIds: ["q"] }), culture("c")]).map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("records 想试 / 试过 / 喜欢 and clears on repeat", () => {
    let p = setCultureState(emptyPass(), "music", "want");
    p = setCultureState(p, "music", "love");
    expect(p.cultures).toEqual({ music: "love" });
    expect(setCultureState(p, "music", "love").cultures).toEqual({});
  });
});

describe("planDays", () => {
  const music = culture("music", { adjacent: [{ id: "night", why: "爵士吧" }], topics: ["culture/stage"], questIds: ["q-xh"] });
  const night = culture("night");
  const vs = [
    venue({ id: "jz", cultureIds: ["music"], area: "徐汇 · 衡山路", ageNote: "酒吧，不适合孩子。" }),
    venue({ id: "hall", cultureIds: ["music"], area: "徐汇 · 复兴中路", kind: "institution", geo: { lat: 31.212, lng: 121.448, precision: "place", via: "" } }),
    venue({ id: "bar", cultureIds: ["night"], area: "徐汇 · 泰安路", geo: { lat: 31.209, lng: 121.447, precision: "poi", via: "" } }),
    venue({ id: "lonely", cultureIds: ["music"], area: "黄浦 · 南京东路" }),
    venue({ id: "nowhere", cultureIds: ["music"], area: "靠近外滩" }),
    venue({ id: "old", cultureIds: ["music"], area: "黄浦 · 人民路", lastSeen: "2023-01-01" }),
  ];
  const quests = [
    { id: "q-xh", areaId: "hengfu", topics: ["culture/stage"], lat: 31.2, lng: 121.445 },
    { id: "q-hp", areaId: "old-city", topics: ["culture/stage"] },
  ] as unknown as Quest[];
  const areaDistricts = new Map([["hengfu", "徐汇"], ["old-city", "黄浦"]]);

  it("builds a district plan: history Quest first, kid-friendly stops before adults-only ones", () => {
    const [p, ...rest] = planDays(music, { cultures: [music, night], venues: vs, quests, areaDistricts }, TODAY);
    expect(rest).toEqual([]); // 黄浦 has one live music venue and no neighbour: not a plan
    expect(p!.district).toBe("徐汇");
    expect(p!.stops.map((s) => (s.kind === "quest" ? s.quest.id : s.venue.id))).toEqual(["q-xh", "bar", "hall", "jz"]);
    expect(p!.length).toBe("day");
    expect(p!.legs.map((l) => (l === null ? null : Math.round(l * 10) / 10))).toEqual([1.0, 0.3, null]);
    expect(p!.adultsPart).toBe(true);
  });
});

describe("planDays ordering", () => {
  it("visits the nearer kid-friendly Venue first after the Quest", () => {
    const art = culture("art", { questIds: ["q"] });
    const g = (lat: number) => ({ lat, lng: 121.45, precision: "poi" as const, via: "" });
    const vs = [
      venue({ id: "far", cultureIds: ["art"], area: "徐汇 · 甲", geo: g(31.25) }),
      venue({ id: "near", cultureIds: ["art"], area: "徐汇 · 乙", geo: g(31.205) }),
    ];
    const quests = [{ id: "q", areaId: "a", topics: [], lat: 31.2, lng: 121.45 }] as unknown as Quest[];
    const [p] = planDays(art, { cultures: [art], venues: vs, quests, areaDistricts: new Map([["a", "徐汇"]]) }, TODAY);
    expect(p!.stops.map((s) => (s.kind === "quest" ? s.quest.id : s.venue.id))).toEqual(["q", "near", "far"]);
  });
});
