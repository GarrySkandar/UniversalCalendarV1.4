# Universal Civilization Calendar v1.3.3 — Architecture / Codex / UI Handoff

## 1. Release intent

**Branch from v1.3.0. Do not rebuild this release from v1.3.2.**

v1.3.3 keeps the v1.2.x Plugin ABI + I18n + Terminology + Renderer architecture and restores the rich civilization hierarchy of v1.3.0. The UI complexity is handled by a stable information hierarchy and a selectable civilization tree, **not by simple/civilization/professional display modes**.

Project question remains:

> 某个行星、某个地点、某个时刻，在不同文明中分别意味着什么。

Root temporal identity remains:

```text
Planet + Instant + Location
```

Do not re-center the engine on Gregorian. Gregorian is the main user-facing date in the hero, but only one Calendar RuleSet in the engine.

## 2. Fixed left navigation

```text
日历
天文
地点
历法转换
世界历法
引擎架构
────────
关于我们
捐赠
```

Routing:
- 日历 -> `today`, with Today / Month sub-tabs
- 天文 -> `astronomy`
- 地点 -> `earth`
- 历法转换 -> `converter`
- 世界历法 -> `capabilities` (old capability/data matrix)
- 引擎架构 -> `about`
- 关于我们 -> `site-about`
- 捐赠 -> `donation`

Do not reintroduce “更多 / More” just to hide World Calendars or Architecture.

## 3. Civilization Calendars side panel

`#traditionPanel` is a **date-view configuration panel**, not a global website sidebar.

Show only on:
- Today
- Month Calendar

Hide on:
- Astronomy
- Location
- Converter
- World Calendars
- Architecture
- About Us
- Donate

The selector implementation is `ui/civilization-calendar-selector.js`. Preserve nested branches. UI simplification must never delete RuleSets/traditions. The panel-level `全选 / 全取消` actions must update both system and selectable leaf IDs, persist the shared selection state, and refresh dependent date layers.

### Current tree

```text
基督教相关历法与传统
├─ 格里高利历（国际公历）【默认选中】
│  ├─ 西方基督教共同使用
│  ├─ 天主教礼仪传统
│  ├─ 新教主要传统
│  └─ 后期圣徒教会传统
├─ 儒略历
│  └─ 东正教旧历传统
├─ 修订儒略历
│  └─ 东正教新历传统
├─ 亚美尼亚使徒教会传统
├─ 科普特历 · 科普特正教传统
└─ 埃塞俄比亚历 · 埃塞俄比亚正教传统

伊斯兰历

中华农历
├─ 道教
├─ 汉传佛教
├─ 中国传统黄历
├─ 皇极经世
└─ 三元九运

印度传统历法
├─ 印度教传统
├─ 锡克教
├─ 耆那教
└─ Panchanga

南传佛历

日本传统
└─ 日本年号

犹太教
├─ 以色列传统
└─ 散居地传统

琐罗亚斯德教
巴哈伊教
硅基文明
```

Important: Israel/Diaspora are observance variants. Do not rename these into “new/old Hebrew calendar”. If historical observational vs fixed Hebrew algorithms are added, model them as Calendar RuleSets separately.

## 4. Date page information contract

Both Today and Month-selected-date use the same logical renderer (`TodayHumanPage.renderDateModules`).

Order:

```text
Gregorian hero: date + local clock time
↓
Era Layer
↓
Different Civilizations Today
↓
Civilization Observances
↓
┌─ Chinese Almanac ─────┬─ Huangji Jingshi ─┐
│                       │ Sanyuan Jiuyun    │
└───────────────────────┴───────────────────┘
↓
Indian Panchanga
```

The Gregorian hero and Today’s Astronomy share the first row. The Era layer follows immediately after that row. The Chinese Almanac uses the left half of the date-system area; Huangji Jingshi and Sanyuan Jiuyun form a stacked right column.

### Gregorian hero
Only Gregorian date and local clock time are primary dates. Do not put lunar/Islamic/Hebrew/etc. dates into the hero.

### Different Civilizations Today
Selection-driven. It displays selected civilization calendar/date representations and traditional time where applicable.

### Era Layer
Selection-driven. Current order:
1. Silicon Era
2. Han Buddhist Era
3. Theravada Buddhist Era
4. Chinese historical chronology, including ROC continuation from 1912 (when available)
5. Japanese Era Name

In the Chinese UI this layer is labeled `中华历史纪年` and appears before Japanese Era Name.

The Chinese Almanac plugin also exposes twelve double-hours with deity, luck, recommended activities, and avoid activities. Daoist date formatting uses the sexagenary year name from the Chinese Ganzhi layer plus the lunisolar month/day.

The Month Calendar selected-date inspector always renders the Chinese historical chronology for its selected Gregorian date, independent of the month-grid era annotation toggle or civilization selector state.

### Civilization Observances
Not selection-driven. If an important observance is in the dataset for the selected date, it should appear regardless of the calendar selector.

Category contract supports:
- religion
- country
- civilization
- history
- culture
- international

Observances may provide `wikipedia` / `links` for future direct references.

## 5. Traditional time

Module: `ui/traditional-time.js`.

### Chinese 12 shichen + ke
Current explicit RuleSet: **96-ke system**.
- 12 shichen/day
- 8 ke/shichen
- 15 min/ke
- UI labels split the shichen into 初/正 halves.

Historical note must stay visible: earlier 100-ke systems existed, so this must not be presented as universal across all Chinese history.

### Indian/Buddhist six-time hierarchy
Current exposed hierarchy follows the classical chain:
- 6 `时` per day-night (3 day + 3 night)
- 5 muhurtas / 时
- 30 lava / muhurta
- 60 tatksana / lava
- 120 ksana / tatksana

Current display implementation uses six equal 4-hour mean-clock blocks starting at 06:00. Treat the anchor as **v1.3.3 Mean Clock RuleSet**, not as a universal historical fact. A future location-aware variant may consume sunrise/sunset from Astronomy and be registered as a separate RuleSet.

For Month Calendar, `#selectedClockTime` lets the user choose a clock time for a non-today date; otherwise the current local time is used.

## 6. World Calendars vs Engine Architecture

World Calendars is the capability matrix:
- calendar / plugin identity
- type
- status
- RuleSet
- provider / implementation
- source
- coverage
- accuracy

Engine Architecture is a separate first-class page:

```text
Physical Time
  ↓
Astronomical Time
  ↓
Calendar Time
  ↓
Civilizational Time
  ↓
Interpretive Time
```

and:

```text
Provider -> Plugin -> Structured Result -> I18n/Terminology -> Renderer -> UI
```

Do not merge these two pages.

## 7. Core dependency direction

```text
UI
 ↓
Renderer
 ↙       ↘
I18n   Terminology
       ↓
     Plugin
       ↓
    Provider
       ↓
      Core
```

No Core -> UI dependency. UI language must never alter calendar calculation.

## 8. Key files in v1.3.3

- `app.js` — app coordinator; keep under ~450 lines when practical
- `ui/pages/today-human-page.js` — shared human-facing date layers
- `ui/pages/today-human-page.js` — shared human-facing date layers and complete Sanyuan Jiuyun summary
- `ui/today-layout.js` — Today-only local layout order, resize, nested sorting, and reset behavior
- `ui/civilization-calendar-selector.js` — nested civilization selector catalog
- `ui/traditional-time.js` — Chinese and Indian traditional time display RuleSets
- `ui/pages/markdown-page.js` — About / Donation Markdown renderer
- `presentation/i18n/locales/v133-ui.js` — v1.3.3 page/nav i18n overrides
- `observance-data.js` — observances + categories/link contract
- `services/api-client.js` — backend access/cache
- `core/plugin-manager.js` — executable Plugin Manager
- `presentation/renderers/renderer-registry.js`
- `presentation/terminology/terminology-registry.js`
- `styles.css` — Today two-column hero and half-width date-system layout

## 9. About / Donation content

```text
content/about/zh-CN.md
content/about/en.md
content/donation/zh-CN.md
content/donation/en.md
config/donation.json
```

Donation accounts should be data/config, not hard-coded into JS.

## 10. Rules for future changes

1. Preserve existing detailed civilization branches unless a source-based correction requires change.
2. UI simplification may collapse/expand branches visually, but must not delete them from the data model.
3. Keep observance variants separate from calendar algorithm variants.
4. Do not classify Religion as Calendar or Country as Calendar.
5. Do not use longitude as civil timezone when an administrative timezone is known.
6. Do not turn an approximate traditional-time convention into a universal historical fact.
7. New calendar/plugin should register metadata and become visible in World Calendars automatically.
8. Date renderer should be shared between Today and selected Month date.
9. Main hero stays Gregorian-only; non-Gregorian dates belong in Different Civilizations Today.
10. Civilization Observances are globally date-driven and independent of the user selection tree.
11. The Sanyuan Jiuyun plugin uses the explicit `hierarchical-cycle` representation and must remain independently executable from the Huangji renderer.

## 11. Verification in this release

`tests_v133.js` verifies:
- left-nav order
- no display modes
- World Calendars and Architecture placement
- right selector only on date pages
- detailed Christian branches
- Jewish Israel/Diaspora variants
- ROC/Japanese era entries
- date-module ordering
- traditional Chinese shichen/ke samples
- Indian six-time samples
- About/Donation files

Also run `tests_core.js` and `tests_v120.js`.
