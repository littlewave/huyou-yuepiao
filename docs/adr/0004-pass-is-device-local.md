# The Pass lives only on the device

Shortlist, Punches and Dismissals are stored in `localStorage` on one phone, with no account, sync or backend. It's one family on one trip, and a backend would contradict ADR-0002. If the family wants the Pass on a second phone, export/import is a JSON copy-paste, not sync.

Observations (Phase 4) follow the same rule: they live in the Pass under `observations`, never leave the phone, and move between phones only through the Pass export.
