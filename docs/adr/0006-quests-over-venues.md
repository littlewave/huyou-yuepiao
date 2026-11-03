# Knowledge is organised as Quests over a 12-Domain taxonomy; Places become anchors

The Library skewed to ticketed indoor venues because its seven themes were venue types (艺术, 书店, 科学动手), so anything without a ticket desk had nowhere to belong. We now model knowledge as **Quests** (a question, observation steps, things to look for, cited Evidence) tagged with Topics from 12 Domains and optional Eras, grouped by **Area**. A Quest can cover a public-space range (`scope`) with no Place at all. Places stay as anchors a Quest can point at.

Considered: widening the seven themes to twenty. Rejected, because it keeps the unit as "a venue to visit" and leaves "what to look at once there" implicit, which is the part that turns a visit into understanding.

Every Quest cites Evidence records, and `checkGraph` rejects background paragraphs without a citation. The old `themes` field stays as the today-screen filter until Domains replace it in the UI, so nothing is migrated twice.
