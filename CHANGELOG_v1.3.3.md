# Changelog — Universal Civilization Calendar v1.3.3

## Goal

v1.3.3 is rebuilt from **v1.3.0** rather than stacking more UI simplification on v1.3.2. It restores detailed civilization/tradition branches and keeps the date page understandable without hiding expert capabilities.

## Navigation

Left navigation is now fixed:

1. 日历 / Calendar
2. 天文 / Astronomy
3. 地点 / Location
4. 历法转换 / Calendar Converter
5. 世界历法 / World Calendars — the capability/data matrix
6. 引擎架构 / Engine Architecture
7. 关于我们 / About Us
8. 捐赠 / Donate

`各文明历法` appears only for Today and Month Calendar. It is hidden on Location, Astronomy, Converter, World Calendars, Architecture, About, and Donate.

The civilization-calendar panel provides `全选 / 全取消` actions. They update top-level systems and selectable leaf branches together, persist the shared selection state, and refresh the Today/Month date layers.

## Today / selected date information order

1. Gregorian date + local clock time
2. 纪年 / Era layer
3. 不同文明的今天 — selected civilization calendar dates + traditional time
4. 文明纪念 / Civilization observances
5. 中国传统黄历（左侧半宽）
6. 皇极经世（右侧上方）
7. 三元九运（右侧下方）
8. Indian Panchanga

## Today layout and Sanyuan Jiuyun

- 公历日期 Hero 与今日天文并排，修正旧三列网格造成的空白列。
- Today 页面增加本地布局配置：模块拖拽排序、模块尺寸调整、模块内子模块排序和恢复默认布局，无需账号。
- Month Calendar 选中日期始终显示中华历史纪年，切换月份时同步选中日期并更新对应年号，不受纪年标注开关影响。
- 纪年紧跟公历/天文首行之后。
- 中国黄历占日期系统区域左半宽；皇极经世与三元九运堆叠在右半宽。
- 中国黄历补充十二时辰吉凶、天神、宜忌，并高亮当前本地时辰。
- 民国纪年并入中华历史纪年；纪年层将中华历史纪年放在日本年号之前；道教日历使用六十甲子年名配合农历月日。
- 三元九运补充当前状态、元/运时间范围、运星、卦象、五行、运内年份、180 年周期进度和 RuleSet。
- Plugin Contract 接受 `hierarchical-cycle`，保证三元九运独立插件可以完整注册和执行。

The Month Calendar selected-date inspector reuses the same date-layer renderer and adds a clock-time input so traditional time can be evaluated for a selected date.

## Restored detailed civilization hierarchy

### Christianity
- Western Christianity
  - Western common calendar
  - Catholic
  - Major Protestant traditions
- Eastern Orthodox
  - New Calendar tradition
  - Old Calendar tradition
- Armenian Apostolic
- Coptic Orthodox
- Ethiopian Orthodox

### Judaism
- Israel observance tradition
- Diaspora observance tradition

These are observance variants, not falsely labelled as a “new Hebrew calendar / old Hebrew calendar” pair. Historical/observational and modern fixed Hebrew calendar RuleSets belong in the calendar/rules layer.

### Chinese tradition
- Daoist tradition
- Han Buddhism
- ROC Era
- Chinese Almanac
- Huangji Jingshi
- Sanyuan Jiuyun

### India
- Hindu traditions
- Sikh tradition
- Jain tradition
- Panchanga

Japanese Era Name is also selectable under Japanese Tradition.

## Era layer

User-facing order:
1. Silicon Era
2. Han Buddhist Era
3. Theravada Buddhist Era
4. ROC Era / 民国纪年
5. Japanese Era Name / 日本年号
6. Chinese historical chronology when available

## Traditional time

### Chinese
The current UI RuleSet uses the 96-ke system: 12 shichen × 8 ke, 15 minutes per ke. The UI explicitly notes that earlier 100-ke systems existed.

### Indian/Buddhist six times
The traditional hierarchy exposed in the UI is:
- 6 times per day-night: three daytime + three nighttime
- 5 muhurtas per time
- 30 lava per muhurta
- 60 tatksana per lava
- 120 ksana per tatksana

Current v1.3.3 uses a mean-clock display convention with six equal four-hour periods beginning at 06:00. This is an implementation RuleSet, not a claim that every historical Indian region used this civil-clock anchor. Future location-aware/sunrise-based variants can be separate RuleSets.

## Content pages

About Us uses Markdown from `content/about/`. Donation uses Markdown from `content/donation/`; payment methods are reserved in `config/donation.json`.

## Tests

- `tests_core.js` — core calendar algorithms
- `tests_v120.js` — Plugin ABI / I18n / Renderer architecture regression
- `tests_v122.js` — v1.2.2 runtime regression
- `tests_v133.js` — restored hierarchy, nav, traditional time, era layer, date-module order
