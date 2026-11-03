# 沪游月票

A personal shortlist of places in Shanghai that locals and the city's white-collar crowd go to, for one family's December trip.

## Places

**Place（地点）**:
One curated entry in the library: somewhere the family could spend two hours to a day.
_Avoid_: POI, spot, 打卡点, attraction

**Library（精选库）**:
The complete hand-curated set of Places. Nothing enters it by crawling or generation at runtime.
_Avoid_: database, catalog, feed

**Tourist Circuit（游客线）**:
The landmarks every first-time visitor already knows (外滩, 城隍庙, 南京路, 田子坊, 新天地…). Places on it are excluded from the Library by definition.
_Avoid_: hot spots, must-sees

**Local Reason（本地理由）**:
The one-sentence answer to "why does someone who lives here go?" Every Place has exactly one.
_Avoid_: description, summary

**Kid Hook（孩子看点）**:
The concrete thing a specific child gets out of a Place. Every Place carries one for the 9-year-old and one for the 16-year-old.
_Avoid_: kid-friendly, family score

**Verification（核实）**:
A dated check of a Place's volatile facts (open, booking rules) against a live source. A Place without one is **Unverified**.
_Avoid_: confirmed, validated

## Choosing

**Base（出发点）**:
The point distances are measured from; 陆家嘴 by default.
_Avoid_: home, location

**Conditions（今日条件）**:
The constraints the family sets for one outing: time available, distance from Base, rain-safe or not, Domains.
_Avoid_: filters (in user-facing copy), preferences

**Candidate（候选）**:
A Place that satisfies today's Conditions and has not been Punched or Excluded (a Revisit is a Candidate again).
_Avoid_: result, recommendation, match

**Surprise Pick（随便来一个）**:
One Candidate chosen at random, for when the family can't decide.

## The Pass

**Pass（月票）**:
The family's record for this trip: every Clue, Shortlist, Punch, Revisit and Exclusion, and the Trip Days of the Punches.
_Avoid_: profile, history, account

**Trip Day（行程日）**:
A calendar date inside the trip window (December 2026 by default).

**Shortlist（想去）**:
Places the family has marked as wanting to go. A Shortlisted Place is still a Candidate.
_Avoid_: favourites, saved, wishlist

**Punch（打孔 / 去过）**:
The mark that the family visited a Place, recorded with the Trip Day it happened on. A Punch stamps the Place; it does not remove it.
_Avoid_: check-in, 打卡, completed

**Revisit（想再去）**:
A Punched Place the family wants to go back to. It keeps the Punch's Trip Day and is a Candidate again.

**Clue（线索）**:
A mark meaning "worth following up", lighter than Shortlist. It can sit on a Place or on a Fragment.
_Avoid_: lead, tip

**Exclude（排除）**:
The family's decision against a Place or Fragment, with an optional **Exclusion Reason** (商业化陷阱, 本地人回避, 当前不可进入, 季节性关闭, 信息过时, 不适合我们). Reversible.
_Avoid_: dismiss, 不去了, delete, hide

## Signals

**Clue Pool（线索流）**:
Every Fragment gathered at research time, shown apart from the Library.
_Avoid_: feed (in code it is fine), inbox

**Fragment（碎片）**:
One raw, unprocessed piece of the Clue Pool (a headline, a post excerpt, a map point), always with its Sources. Graded **fragment** (usable), **Weak Signal**, or **Anti-recommendation**.
_Avoid_: clue (that is a mark), item

**Weak Signal（弱信号）**:
A Fragment that is incomplete but might be interesting; it always says why it is weak.

**Anti-recommendation（反推荐）**:
A Fragment naming somewhere deliberately kept out of the Library, with its Exclusion Reason. Together they are the **Negative Space（负空间）**.

**Source（来源）**:
Where a claim came from: its kind (新闻, 政府, Reddit, 博客, OSM, 社区, 指南, AI整理, 编辑), name, link and date.

**Signal Strength（信号强度）**:
How far to trust a claim, from its Sources: 多来源交叉确认, 单一具名来源, 单一匿名帖子提到, or 仅编辑判断.

**Freshness（新鲜度）**:
The age of the newest dated Source (or the Verification), told as 本周 / N 个月前 / N 年前.

**Anti-signal（反信号）**:
A known downside of a Place: crowds, construction, booking friction.
_Avoid_: warning, con

**Next Glance（顺路看一眼）**:
One door, street or shop near a Place that is worth a glance on the way. Not a nearby attraction.
_Avoid_: nearby, next clue

**Thin Zone（信息稀薄区）**:
An area where the Library and Clue Pool have no signal. It says nothing about whether the area is worth visiting.

## Knowledge

**Domain（领域）**:
One of the twelve fields the city is understood through (城市肌理与街巷, 工业文明与基础设施, 市井生活与社会观察…).
_Avoid_: category, theme (a theme is a Place's venue type)

**Topic（主题）**:
A named subject inside a Domain (里弄与石库门, 港口与航运). A Place or Quest carries several.
_Avoid_: tag (in user-facing copy)

**Era（时代地层）**:
A period of the city's history a Place or Quest visibly carries (开埠与租界, 工业城市年代…).
_Avoid_: dynasty, decade

**Area（区域）**:
A stretch of city that Places and Quests are grouped by: a neighbourhood, a river corridor, a district or a town.
_Avoid_: zone, region

**Quest（探索任务）**:
A question to answer on the ground, with the steps to observe, what to look for, and the Evidence behind its background.
_Avoid_: mission, challenge, task (a task is one step inside a Quest)

**Trail（探索线路）**:
An ordered walk through several Quests in one Area.
_Avoid_: route, itinerary

**Evidence（证据）**:
One factual claim with its Sources. It is **Checked** once the claim was read in a linked source, and says by whom: the research assistant (shown as 待你复核) or the owner.
_Avoid_: fact, reference

**Observation（观察记录）**:
What the family noted and found while doing a Quest, and the day they marked it **Done（做过）**. A Quest is **Touched** once anything is found, written or done.
_Avoid_: check-in, log, journal entry

**Lens（探索身份）**:
A way of looking (城市侦探, 基础设施工程师, 自然观察员…) that leans on some Domains. Not a level or a badge.
_Avoid_: role, persona, achievement

**Review（复核）**:
The owner's own reading of an Evidence's source on the phone, with a verdict: 对得上 (ok) or 有问题 (problem).
_Avoid_: approval, rating

**Coverage（探索覆盖面）**:
Which Domains, Areas and Eras the family has touched, and which remain unknown.
_Avoid_: progress score, completion

## Shanghai Now（上海正在发生）

**Culture（文化类型）**:
A long-standing kind of contemporary culture (脱口秀, Livehouse, 古着…) with a first-time guide. Cultures can be added or merged.
_Avoid_: trend (that is a separate thing), category

**Trend（趋势）**:
Something warming up now, kept apart from Cultures. Its heat is its Signal: independent named outlets and recency, never exposure counts.
_Avoid_: hot, viral

**Venue（场地）**:
A real place or long-running programme where a Culture happens, with the date a source last showed it active. It shows as 待确认 once that date is too old for its kind.
_Avoid_: spot, POI

**Event（活动）**:
One dated happening, or a weekly one confirmed until a date. It leaves every list once it has ended.
_Avoid_: listing, show (unless it is one)

**First Try（第一次体验）**:
A Culture card's guide for someone new: what to expect, small rules, the easiest way in, and what each child gets.

**Interest Spread（兴趣扩散）**:
Moving from a Culture the family knows to its neighbours, each step saying why they connect.

**Now Day（潮流探索日）**:
A half-day or day inside one district: a history Quest, Venues of one Culture, and one of a neighbouring Culture.
_Avoid_: itinerary, route

**Culture Map（我的文化版图）**:
The Cultures the family marked 想试, 试过 or 喜欢.
