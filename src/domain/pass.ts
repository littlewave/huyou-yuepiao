import { BASES, DEFAULT_CONDITIONS, DEFAULT_TRIP } from "./constants";
import type { Conditions, ExclusionReason, MarkState, Observation, Pass, Review } from "./types";

export const isVisited = (state: MarkState | undefined) => state === "punched" || state === "revisit";

const KEY = "huyou-pass-v1";

export function emptyPass(): Pass {
  return { version: 1, trip: { ...DEFAULT_TRIP }, baseId: BASES[0]!.id, marks: {}, conditions: { ...DEFAULT_CONDITIONS } };
}

/**
 * Set a Place's (or Fragment's) mark; setting the state it already has clears it (every stamp is reversible).
 * A Punch made outside the trip window gets no Trip Day; the family can set one on the Pass.
 * Revisit sits on top of a Punch: toggling it keeps the Trip Day, and un-punching clears both.
 */
export function toggleMark(pass: Pass, id: string, state: MarkState, today: string): Pass {
  const marks = { ...pass.marks };
  const cur = marks[id];
  const inTrip = today >= pass.trip.start && today <= pass.trip.end;
  if (state === "revisit") {
    if (cur?.state === "revisit") marks[id] = { state: "punched", day: cur.day };
    else marks[id] = { state: "revisit", day: cur?.state === "punched" ? cur.day : inTrip ? today : undefined };
  } else if (cur?.state === state || (state === "punched" && cur?.state === "revisit")) {
    delete marks[id];
  } else {
    marks[id] = state === "punched" && inTrip ? { state, day: today } : { state };
  }
  return { ...pass, marks: clean(marks) };
}

export function setExclusionReason(pass: Pass, id: string, reason: ExclusionReason): Pass {
  const mark = pass.marks[id];
  if (mark?.state !== "dismissed") return pass;
  return { ...pass, marks: { ...pass.marks, [id]: { ...mark, reason: mark.reason === reason ? undefined : reason } } };
}

/** Drop undefined fields so the stored JSON stays tidy. */
function clean(marks: Pass["marks"]): Pass["marks"] {
  for (const m of Object.values(marks)) for (const k of Object.keys(m) as (keyof typeof m)[]) if (m[k] === undefined) delete m[k];
  return marks;
}

export function setPunchDay(pass: Pass, placeId: string, day: string): Pass {
  const mark = pass.marks[placeId];
  if (mark?.state !== "punched" && mark?.state !== "revisit") return pass;
  return { ...pass, marks: { ...pass.marks, [placeId]: { ...mark, day } } };
}

export function setConditions(pass: Pass, conditions: Conditions): Pass {
  return { ...pass, conditions };
}

/** Trip Days as YYYY-MM-DD, start to end inclusive. */
export function tripDays(trip: Pass["trip"]): string[] {
  const days: string[] = [];
  const d = new Date(trip.start + "T00:00:00Z");
  const end = new Date(trip.end + "T00:00:00Z");
  while (d <= end && days.length < 62) {
    days.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
}

export function punchedDays(pass: Pass): Set<string> {
  return new Set(Object.values(pass.marks).flatMap((m) => (isVisited(m.state) && m.day ? [m.day] : [])));
}

/** Parse a stored or imported Pass; null when the text isn't one. */
export function tryParsePass(raw: string | null): Pass | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Partial<Pass>;
    if (p.version !== 1 || typeof p.marks !== "object" || !p.marks) return null;
    const base = emptyPass();
    // Passes saved before Domains replaced themes carry a stale `themes` filter; drop it.
    const { themes: _stale, ...conditions } = (p.conditions ?? {}) as Partial<Conditions> & { themes?: unknown };
    return { ...base, ...p, trip: { ...base.trip, ...p.trip }, conditions: { ...base.conditions, ...conditions } } as Pass;
  } catch {
    return null;
  }
}

export const parsePass = (raw: string | null): Pass => tryParsePass(raw) ?? emptyPass();

export function loadPass(): Pass {
  try {
    return parsePass(localStorage.getItem(KEY));
  } catch {
    return emptyPass();
  }
}

export function savePass(pass: Pass): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(pass));
  } catch {
    // Private mode or storage full: the session still works, it just won't persist.
  }
}

// ── Observations ─────────────────────────────────────────────────────────

const blank = (now: string): Observation => ({ note: "", found: [], updatedAt: now });

/** Apply a change to one Quest's Observation, dropping it again when it ends up empty. */
function observe(pass: Pass, questId: string, now: string, change: (o: Observation) => Observation): Pass {
  const all = { ...(pass.observations ?? {}) };
  const next = { ...change(all[questId] ?? blank(now)), updatedAt: now };
  if (!next.note.trim() && next.found.length === 0 && !next.doneOn) delete all[questId];
  else all[questId] = next;
  return { ...pass, observations: all };
}

export const setNote = (pass: Pass, questId: string, note: string, now: string) =>
  observe(pass, questId, now, (o) => ({ ...o, note }));

export const toggleFound = (pass: Pass, questId: string, index: number, now: string) =>
  observe(pass, questId, now, (o) => ({
    ...o,
    found: o.found.includes(index) ? o.found.filter((i) => i !== index) : [...o.found, index].sort((a, b) => a - b),
  }));

export const toggleQuestDone = (pass: Pass, questId: string, today: string, now: string) =>
  observe(pass, questId, now, (o) => {
    const { doneOn, ...rest } = o;
    return doneOn ? rest : { ...rest, doneOn: today };
  });

/** A Quest counts as touched once the family found something, wrote something, or marked it done. */
export const isTouched = (o: Observation | undefined) => !!o && (!!o.doneOn || o.found.length > 0 || !!o.note.trim());

// ── Reviews ──────────────────────────────────────────────────────────────

/** Record the owner's verdict on one Evidence; the same verdict again clears it. */
export function setReview(pass: Pass, evidenceId: string, verdict: Review["verdict"], today: string): Pass {
  const all = { ...(pass.reviews ?? {}) };
  if (all[evidenceId]?.verdict === verdict) delete all[evidenceId];
  else all[evidenceId] = { verdict, on: today };
  return { ...pass, reviews: all };
}
