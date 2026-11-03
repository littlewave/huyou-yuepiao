---
name: 沪游月票
description: A December trip pass for Shanghai, built as a 1980s–90s 公交月票 that gets punched for every place visited.
colors:
  pass-green: "#0e5e5a"
  pass-green-deep: "#0a4643"
  pass-green-line: "rgba(230, 242, 236, 0.28)"
  on-green: "#e6f2ec"
  on-green-2: "#b9d6cc"
  stock: "#e6f2ec"
  stock-2: "#d6e8e0"
  slip: "#ffffff"
  ink: "#14302c"
  ink-2: "#3c5e58"
  ink-3: "#536f69"
  month: "#f3d34a"
  cinnabar: "#c8361f"
  void: "#5a6b67"
  t-art: "#2f5da8"
  t-heritage: "#a0522d"
  t-walk: "#6b5ba6"
  t-nature: "#3e7f45"
  t-books: "#8f6a12"
  t-science: "#1b7a8c"
  t-food: "#c0562c"
typography:
  display:
    fontFamily: "Barlow Condensed, DIN Condensed, Arial Narrow, sans-serif"
    fontSize: "76px"
    fontWeight: 700
    lineHeight: 0.78
    letterSpacing: "-0.02em"
  numeral-stub:
    fontFamily: "Barlow Condensed, DIN Condensed, Arial Narrow, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1
  numeral:
    fontFamily: "Barlow Condensed, DIN Condensed, Arial Narrow, sans-serif"
    fontWeight: 600
    letterSpacing: "0.01em"
    fontFeature: "tnum"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.3
  title-pass:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, sans-serif"
    fontSize: "20px"
    fontWeight: 650
    letterSpacing: "0.12em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, sans-serif"
    fontSize: "17px"
    fontWeight: 650
    lineHeight: 1.35
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  body-reading:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, sans-serif"
    fontSize: "13px"
    fontWeight: 650
    letterSpacing: "0.04em"
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, PingFang SC, Hiragino Sans GB, Noto Sans SC, Microsoft YaHei, sans-serif"
    fontSize: "12px"
    fontWeight: 600
rounded:
  day: "4px"
  stamp: "5px"
  field: "10px"
  slip: "12px"
  sheet: "20px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  gutter: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.pass-green}"
    textColor: "{colors.on-green}"
    rounded: "{rounded.slip}"
    padding: "0 16px"
    height: "52px"
  button-undo:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.slip}"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.slip}"
    textColor: "{colors.ink}"
    rounded: "{rounded.slip}"
    padding: "0 16px"
    height: "44px"
  button-secondary-pressed:
    backgroundColor: "{colors.stock-2}"
    textColor: "{colors.ink}"
  button-pick:
    backgroundColor: "{colors.pass-green}"
    textColor: "{colors.on-green}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "40px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.on-green}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "40px"
  chip-selected:
    backgroundColor: "{colors.month}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
  segment:
    backgroundColor: "{colors.pass-green-deep}"
    textColor: "{colors.on-green-2}"
    rounded: "{rounded.slip}"
    padding: "3px"
  segment-selected:
    backgroundColor: "{colors.on-green}"
    textColor: "{colors.ink}"
    height: "40px"
  sheet:
    backgroundColor: "{colors.stock}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
    padding: "16px"
  slip:
    backgroundColor: "{colors.slip}"
    textColor: "{colors.ink}"
    rounded: "{rounded.slip}"
    padding: "14px 14px 12px"
  ticket:
    backgroundColor: "{colors.slip}"
    textColor: "{colors.ink}"
    rounded: "{rounded.slip}"
    padding: "18px 16px"
  stamp:
    backgroundColor: "transparent"
    textColor: "{colors.cinnabar}"
    rounded: "{rounded.stamp}"
    padding: "3px 8px"
  stamp-void:
    textColor: "{colors.void}"
    rounded: "{rounded.stamp}"
  field:
    backgroundColor: "{colors.slip}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0 12px"
    height: "44px"
  tab-bar:
    backgroundColor: "{colors.pass-green-deep}"
    textColor: "{colors.on-green-2}"
    height: "64px"
  tab-active:
    textColor: "{colors.month}"
---

# Design System: 沪游月票

## Overview

**Creative North Star: "The December 月票"**

The whole app is one Shanghai 公交月票 from the 1980s–90s: a peacock-green card with a pale mint printed stock, a big yellow month numeral, a strip of days, and a conductor's punch. The shell is the card's green cover; content sits on a mint sheet that rises from it with a rounded top edge, faintly cross-hatched like security-printed stock. Each candidate place is a white slip torn from that pass: a numeral stub on the left, a dashed perforation, die-cut notches at the tear line, then the place. Marking a place 去过 cuts a hole in the slip's stub, punches the same day on the strip, and lands a cinnabar stamp.

Density is phone-first and calm: one column, 16px gutters, generous line height for Chinese reading, figures set large in a condensed numeral face so hours, kilometres and counts read at a glance in winter daylight. The palette is green, mint and white with exactly two loud voices: 月份黄 for "this is active / this is now" and 印泥红 for "been there". Nothing is photographic; the object itself carries the identity.

The build rejects the category default of photo-card feeds over white with a search bar. There are no images, no gradients beyond the printed hatch, and no third-party assets: every font and icon ships in the build (see docs/adr/0002).

**Key Characteristics:**
- Green cover, mint stock, white slips: three material layers, always in that order.
- Two accent voices with strictly separated jobs: yellow for active/now, cinnabar for 去过 only.
- Condensed numerals (Barlow Condensed, self-hosted) for every figure; system PingFang stack for every word.
- Ticket mechanics as UI: perforations, die-cut notches, punched holes, rotated rubber stamps, a pass-type colour rule along each slip's top edge.
- One authored line-icon set (24px grid, 1.75 stroke, round joins).

## Colors

A transit-pass palette: deep peacock green and mint stock, white paper, with yellow and cinnabar used as ink rather than fill.

### Primary
- **月票孔雀绿 Pass Green** (pass-green): the card cover. Page background behind the head and conditions, primary buttons, the 随便来一个 pick button, duration-bar fill, numeral stubs, section labels on the ticket, focus ring inside the sheet, `theme-color`.
- **Deep Pass Green** (pass-green-deep): the shadowed side of the cover. Segmented control track, tab bar, punched holes on the day strip.
- **Cover Hairline** (pass-green-line): 1px outline of unselected chips on the green.

### Secondary
- **月份黄 Month Yellow** (month): the month numeral, the selected filter chip, the active tab, today's day outline, the Surprise Pick ring around a slip, focus ring on the green, text selection. It always means "active" or "now".

### Tertiary
- **印泥红 Cinnabar** (cinnabar): the 去过 stamp. Nothing else.
- **Theme hues** (t-art 艺术, t-heritage 历史建筑, t-walk 城市漫步, t-nature 自然, t-books 书店, t-science 科学动手, t-food 市集美食): pass-type colours, used only on slips: a 3px rule along the top edge in the slip's first theme, and a 7px rounded-square marker plus the 12px label for each theme in the footer. The warning icon on the ticket borrows t-books as its amber. They never fill a surface, chip or button.

### Neutral
- **Cover Text** (on-green) and **Cover Text Muted** (on-green-2): text and icons on the green; day numerals on the strip use full cover text.
- **Pass Stock** (stock): the mint sheet ground, also the dividers between list rows and the date-input ground.
- **Stock Shade** (stock-2): perforation dashes (slip stub, detail hooks, verification rule), duration-bar track, offline note, pressed secondary button.
- **Slip White** (slip): slips, the ticket, rows, fields, secondary buttons.
- **Ink** (ink), **Ink 2** (ink-2), **Ink 3** (ink-3): primary text, secondary text, meta/caption text on paper.
- **Void Grey** (void): the 不去了 stamp.

### Named Rules
**The Cinnabar Rule.** Cinnabar is the 去过 stamp and nothing else: not buttons, not undo, not errors, badges, links or emphasis. A future warning gets its own token.

**The Yellow Means Now Rule.** Month yellow is for the one active or current thing in a group (the selected chip, today, the active tab, the picked slip). Two yellow things in one control group means one is wrong.

**The Small Marker Rule.** Theme hues appear only as thin marks on a slip: the 3px top rule and the 7px square with its 12px label. They never become fills, borders, or chip backgrounds; Domain chips on the green stay in cover colours.

## Typography

**Display / Numeral Font:** Barlow Condensed 600 and 700 (self-hosted via the build; fallback DIN Condensed, Arial Narrow)
**Body Font:** system stack, -apple-system / PingFang SC (fallback Hiragino Sans GB, Noto Sans SC, Microsoft YaHei)

**Character:** Condensed transit-ticket numerals against plain, well-spaced Chinese. The numerals are printed matter; the Chinese is the conductor's handwriting made legible.

### Hierarchy
- **Display** (Barlow Condensed 700, 76px, 0.78): the month numeral in the pass head. One per screen.
- **Numeral Stub** (Barlow Condensed 700, 30px, 1): the hours figure on each slip's stub.
- **Numeral** (Barlow Condensed 600, tabular): every inline figure: counts, km, day numbers, dates, chip counts. Sized to sit with surrounding text (11px on the strip, 18px in ticket facts, 20–22px for result and group counts).
- **Headline** (700, 24px, 1.3, balanced): place name on the detail head.
- **Pass Title** (650, 20px, 0.12em tracking): 沪游月票 / 我的月票 on the cover.
- **Title** (650, 17px, 1.35): slip names, empty-state titles.
- **Body** (400, 15px, 1.5): base text, buttons, rows. Reading prose on the ticket uses 1.65 line height and a 36em measure; slip reasons use 14px / 1.55.
- **Label** (650, 13px, 0.04em, pass green): ticket section headings such as 本地人为什么去, 9 岁看点, 十二月提醒; the 9 岁 / 16 岁 hook terms on slips use the same green at 13px.
- **Caption** (12–13px): meta lines, theme labels, tab labels, units under stubs.

### Named Rules
**The Every Figure Rule.** Any Arabic numeral the user reads goes through the numeral face with tabular figures. This includes the 9 and 16 in the 9 岁 / 16 岁 labels and the date inputs. Chinese units (小时, km, 处, 日, 岁) stay in the body face beside it.

**The No Webfont For Words Rule.** Chinese text uses the system stack only; never add a CJK webfont. Only the Latin numeral face is shipped, and it ships inside the build.

## Layout

A single column capped at 560px, centered; above 560px the page field outside the column is a darker green (#072f2d) so the column reads as the card. Horizontal gutter is 16px everywhere. The cover (head, day strip, conditions) is full-bleed green; the mint sheet follows with a 20px top radius and fills the rest, padded at the bottom for the fixed 64px tab bar plus the safe-area inset. Safe-area insets are honoured at top and bottom.

The day strip is a 16-column grid with 4px gaps, so a 31-day month wraps to two rows. Filter chips scroll horizontally in one row with hidden scrollbar and gutter-aligned scroll padding. The time budget is a three-way segmented control. Slips stack with 12px gaps; each slip is a two-column grid with a fixed 58px stub. Ticket facts sit in a four-up row; detail actions are a two-column grid with the primary spanning both.

Spacing rhythm: 4 / 8 / 12 / 16 / 24px, with 20–28px separating major groups (sheet top, pass groups).

## Elevation & Depth

Depth is mostly material layering (green cover, mint stock, white paper) with soft green-tinted ambient shadows under paper only. Shadows are never black-grey and never hard-offset.

### Shadow Vocabulary
- **Slip rest** (`box-shadow: inset 0 3px 0 var(--slip-hue), 0 1px 2px rgba(10,70,67,0.08), 0 3px 10px rgba(10,70,67,0.06)`): slips at rest; the inset layer is the theme top rule, kept inside the radius and mask. Every slip shadow state keeps it first.
- **Ticket rest** (`box-shadow: 0 1px 2px rgba(10,70,67,0.08), 0 4px 14px rgba(10,70,67,0.07)`): the detail ticket.
- **Lift on hover** (`box-shadow: 0 6px 18px rgba(10,70,67,0.14)`): slips on hover-capable devices; buttons use `0 2px 8px rgba(10,70,67,0.12)`.
- **Picked ring** (`box-shadow: inset 0 3px 0 var(--slip-hue), inset 0 0 0 2.5px #f3d34a, 0 6px 18px rgba(10,70,67,0.16)`): the Surprise Pick slip; the ring is inset so the mask does not clip it.
- **Punched hole** (`box-shadow: inset 0 1px 1.5px rgba(0,0,0,0.35)`): the hole on a punched strip day, so it reads as cut through.

### Named Rules
**The Paper Only Rule.** Only white paper (slips, ticket, buttons) casts shadow. The green cover and mint sheet are flat; their separation is colour and the sheet's rounded top.

## Shapes

Ticket geometry. Paper has gently rounded 12px corners; the sheet's top edge is 20px; filters and the pick button are full pills; day cells are 4px; stamps are 5px rubber-stamp frames rotated -9°. The slip's signature cut is a pair of 8px semicircular notches masked out of the top and bottom edge at the 58px perforation line, with a 1.5px dashed perforation between stub and body. A punched slip gets a real 6px hole masked through the stub (centered at 29px, 20px), so the sheet shows through. Dashed 1.5px rules also split the detail hooks and separate the verification note. Punched days show a round hole (46% of the cell) in deep green.

## Components

### Buttons
Tactile, ticket-office plain.
- **Shape:** gently rounded (12px), 44px minimum height; detail primary is 52px.
- **Primary:** pass green fill, cover text, 16px horizontal padding (去过 · 打孔). Once the place is punched it is replaced by **Undo**: a full-width 40px quiet text button, transparent, ink-2, 14px weight 500 (撤销打孔).
- **Secondary:** white with a 28% green hairline border and ink text; pressed state fills with stock shade.
- **Quiet:** transparent with the same hairline; used for empty-state relax actions and import/export.
- **Pick (随便来一个):** 40px green pill with the shuffle icon, at the right of the result count.
- **States:** press scales to 0.98 in 120ms; hover adds the small lift shadow; disabled at 45% opacity; busy at 70%. Focus is a 2.5px ring, yellow on the green, pass green inside the sheet.

### Chips
- **Style:** 40px pills on the green, transparent with the cover hairline, cover text, optional 17px line icon. Theme chips carry a numeral count in a 16% mint capsule.
- **State:** selected fills month yellow with ink text and weight 600; a Domain chip with zero results disables at 40% opacity. The distance chip is a native select styled as a chip with a drawn caret.

### Segmented Control
Three equal segments (两小时 / 半天 / 一整天) in a deep-green track with 3px inset; the selected segment is a mint pill with ink text. Transitions 160ms.

### Slips (signature)
White paper, 12px corners, slip-rest shadow with the 3px theme top rule, die-cut notches. Left stub: hours numeral (or minutes under one hour) in pass green with a 11px unit. Body: name (with a 想去 / 线索 / 想再去 tag beside it), meta line (area · 直线 km · setting), the hook (falling back to the local reason), the 9 岁 / 16 岁 hook rows, the first anti-signal behind a t-books warning icon when one exists, then a footer of the signal line (strength bars, source-kind tags, freshness badge) and the duration bar. A slip whose newest source is over two years old renders on spent paper with muted text: an old ticket. Fixed furniture: every slip carries every one of these parts in the same order. Punched or dismissed slips fade to a cooler paper and muted reason text and carry their stamp at top right; punched slips also show the stub hole.

### Duration Bar
A 6px rounded track in stock shade with ticks every 25%; a full bar is an 8-hour day, so the green fill's length is the visit length. 8px on the detail ticket.

### Stamps
A 2px cinnabar frame with 13px weight-750 text, rotated -9°, multiply blend, top right of the slip: 去过 · N日. On the detail ticket it is larger (17px, 2.5px frame). 排除 uses void grey and carries its reason (排除 · 商业化陷阱). A new stamp lands in one 220ms move from -16° at 1.6× scale with a slight blur to rest, while the matching strip day's hole cuts in (scale 0 to 1, same 220ms). Stamps never fade or animate away.

### Signal (strength + freshness)
Strength is three ascending 3px bars, filled pass green to 1 / 2 / 3 for 仅编辑判断 or 单一匿名帖子 / 单一具名来源 / 多来源交叉确认. Freshness is a small 11px badge whose treatment encodes age so this week's news and a five-year-old blog never look alike: 本周 / 本月 filled month yellow; months ago outlined green; up to two years outlined ink-3; older dashed void; undated dotted ink-3. The 来源说明 disclosure under each source block spells out the trust and doubt reasons in words.

### Fragment Cards (线索流)
A smaller slip: a 46px stub carrying the lead source kind set vertically (新闻 / 政府 / Reddit / 博客 / OSM / 编辑), a dashed perforation, then text, a meta line (bars · linked source names · date · freshness), a where-line with a related-Place link and a dotted 坐标约略 tag, and a footer with 来源说明 and a pill 转为线索 button that turns month yellow when on. Weak signals are unfinished tickets: transparent, no shadow, a 1.5px dashed green edge, plus a stock-tinted 为什么是弱信号 note. Anti-recommendations sit on spent paper in void grey with an outlined reason tag.

### Schematic Map
An inline SVG on white paper, never a tile map: rough Huangpu and Suzhou Creek strokes in pale green, the Base as an ink diamond with a white edge, drawn last so nothing covers it. Markers by layer: Quest start = white triangle with a pass-green outline (filled when selected); 正在发生 Venue = small white rounded square with an ink-2 outline; activated clue = month-yellow disc with ink ring; weak signal = white disc with dashed ink ring; visited = pass-green disc with a punched white hole; excluded = void-grey cross; the rest of the Library = small sage dots. 信息稀薄区 is an optional faint diagonal hatch over ~3 km cells with no signal. Layer chips on the green carry a swatch of their marker and a count. Tapping a marker opens a white strip below the map with its layer, name, area and an 打开 button.

### Quest Cards and the 探索 view
A Quest card is a slip: the stub shows minutes, the body leads with the question in 16.5px semibold, then a meta line, Domain pills on stock, and a footer of strength bars plus a fact-check tag (pass green = owner-checked, stock = 已比对来源 · 待你复核, dashed amber = not yet checked). The 探索 view has a four-way segmented control (空间 / 时间 / 主题 / 生活) and a Lens chip row on the green. 主题 shows a two-column grid of white Domain tiles with their count in a pass-green numeral; the chosen tile fills pass green with a month-yellow count. Trails are deep-green collapsible cards with a month-yellow kicker. On the Quest ticket, evidence references are small stock pills with a pass-green numeral; 探索线路 sits on a stock panel with previous / next links; 相关探索 lists each link with why it is related.

### Observations and Coverage
On the Quest ticket, each 要找的证据 item is a full-width 44px toggle with a rounded check box that fills pass green when found. Below the ticket, a white 观察记录 panel holds the note textarea and one wide button: primary 「做完了，记下这一天」, which turns into a quiet 「做过了 · 12 月 3 日」 toggle. Done Quest cards sit on spent paper with a small pass-green 做过 tag; partly done ones show 找到 n/m. In 我的月票, 探索覆盖面 lists Domains, Areas and Eras as label + 6px pass-green bar + n/total numeral, untouched rows in muted ink, followed by a plain 还没碰过 sentence. No scores, levels or streaks.

### 正在发生 (Shanghai Now)
A sixth tab with a three-way segmented control (潮流雷达 / 活动 / 我的版图). Trend cards are white with signal bars, freshness badge, a 自己去看 line and collapsible sources. Culture rows are white tiles with counts in numerals and small tags: month yellow 升温中 (only for a multi-outlet Trend), stock 有趋势线索 for a single-outlet one, ink for the family's state. Event cards are slips with a date stub (every weekday for weekly events) and a state tag: pass green for 即将开始 / 进行中, dashed amber for 待确认. Culture cards reuse the ticket: summary as the hook with an 编辑整理 note, three state buttons, a stock-panel 最容易的入门, plain-dot lists, then sourced facts. 潮流探索日 cards reuse the Trail look: deep green, month-yellow stop numbers, a small tag per stop (历史 or the Culture's short name) and a month-yellow 只适合大人 note on evening stops, which sort last. Venues show 近期有来源 / 待确认 / 已关闭, and an amber age note when a place isn't for the 9-year-old.

### Day Strip
Mint-tinted cells on the green with day numerals in cover text. Today: mint cell, green numeral, inset yellow outline. Punched: mint cell with a deep-green hole and no numeral.

### Ticket (detail)
White paper, 12px corners, 18px × 16px padding, 18px internal gap: optional stamp row, four facts (约需 / 离出发点 / 场地 / 预约), the duration bar, labelled prose sections, the 9 岁看点 / 16 岁看点 hooks as two columns split by a dashed perforation (no nested cards), and the verification note behind a dashed rule (未核实 with a t-books warning icon, or 已核实 in green).

### Inputs / Fields
- **Style:** 44px, white, 10px corners, 25% green hairline, 15px ink text, 13px ink-2 label above.
- **Focus:** the global 2.5px pass-green ring. Date inputs in pass rows use the numeral face on a stock ground with an 8px radius.

### Lists (pass view)
White grouped rows with 12px corners, mint dividers, 56px minimum rows (bold name over a 13px area line). Group headings pair a 15px label with a green numeral count. 排除 rows are muted and carry an outlined reason tag; 想再去 rows carry a green tag.

### Navigation
A fixed 64px tab bar in deep pass green with five tabs, 今日候选 / 探索 / 线索流 / 地图 / 我的月票, each a 20px line icon over a 12px label. Inactive in cover-muted; active in month yellow at weight 600. The detail view replaces the head with a 44px back button and the place name on the green and hides the tab bar.

### Hand-off Links
A white grouped list of 52px rows (高德导航, 大众点评查营业, 小红书看近况) with a trailing external icon in ink-3; the map row leads with a green pin.

## Do's and Don'ts

### Do:
- **Do** keep the three layers in order: green cover, mint hatched stock, white paper slips.
- **Do** set every figure in Barlow Condensed with tabular numerals, and load it from the build, never a font CDN.
- **Do** keep cinnabar for the 去过 fact alone, and month yellow for the single active or current item.
- **Do** show theme identity only as the 3px slip top rule and the 7px square plus label.
- **Do** give every slip the same furniture: stub, perforation, name, meta, reason, both hooks, themes, duration bar.
- **Do** keep touch targets at 40px minimum (44px for buttons and fields) and the yellow or green 2.5px focus ring.
- **Do** draw new icons in the authored set: 24px grid, 1.75 stroke, round caps and joins, `currentColor`.
- **Do** make a stamp or punch permanent once landed; undo is the quiet 撤销打孔 text button, not an exit animation.

### Don't:
- **Don't** use cinnabar for buttons, undo, errors, badges, deletions or emphasis.
- **Don't** fill chips, buttons, slips or headers with theme hues.
- **Don't** nest cards inside the ticket; divide with dashed perforations.
- **Don't** add photography, photo-card feeds, or a search bar over a white page.
- **Don't** load anything from third-party hosts at runtime: fonts, icon packs, map SDKs, analytics (docs/adr/0002).
- **Don't** add a CJK webfont or swap the numeral face for a proportional one.
- **Don't** use neutral grey or black shadows, or hard offset shadows; shadows are soft and green-tinted, under paper only.
