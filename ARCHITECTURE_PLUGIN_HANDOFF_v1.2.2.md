# Universal Civilization Calendar Engine v1.3.0
## 架构、Plugin ABI、I18n、Terminology、Renderer 与 Codex 交接说明

> 当前基线：**v1.3.0**
> 用途：Codex 交接、人工开发交接、新历法/文明时间插件开发、后续重构依据。

---

# 1. 项目核心定义

本项目不是以 Gregorian Date 为根的转换器。

根对象：

```text
Planet + Instant + Location
```

顶层时间模型：

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

Presentation 作为横向服务：

```text
I18n + Terminology + Renderer
```

不得让 Presentation 反向污染计算 Core。

---

# 2. V1.2.0 → V1.3.0 版本关系

V1.2.0 已解决主要平台架构债务：

1. 建立正式 `Plugin Contract / Plugin Manager`，让 Registry 从纯 metadata 走向可执行插件；
2. 建立 Provider / Plugin / Presentation 分层；
3. 建立 I18n、Terminology、Renderer Registry；
4. 将 API、状态和部分页面从 `app.js` 拆出，并保留 Legacy Adapter 渐进迁移。

V1.3.0 **不重新设计这些接口**。本版专门完成 Presentation 国际化覆盖：

- 现有页面静态 UI 文本完整接入简体中文 / English；
- 月历、转换器、地点、天文、能力矩阵、时间文化等动态文本采用语义化 i18n key；
- 旧 HTML 使用独立 `UI Literal Catalog` 兼容，避免为了翻译而破坏页面结构；
- Registry 描述性 metadata 通过 locale metadata 层显示英文；
- 专有历法术语保持 native-first，不因 UI 语言变化而改变算法值。

---


## 2.1 V1.3.0 I18n 边界

```text
Algorithm / Provider / Plugin Engine
            ↓ structured result
Terminology Registry        I18n Core
(native civilizational)     (UI language)
            └──────┬──────────┘
                Renderer
                   ↓
                   UI
```

规则：

- `I18n Core` 翻译导航、按钮、字段名、说明、错误、状态等通用 UI；
- `Terminology Registry` 保存文明原生术语及可选转写/译名；
- 日期计算、JDN、干支、Tithi、Pawukon、Maya day sign 等结果不依赖 UI locale；
- 当前产品实际完整 UI locale：`zh-CN`、`en`；其它语言仅保留扩展能力，尚未宣称内容完整。

# 3. V1.2.x 平台架构

```text
                         UI Shell
                            │
              ┌─────────────┼─────────────┐
              │             │             │
            I18n       Terminology     Renderer
              │             │             │
              └─────────────┼─────────────┘
                            ↓
                       Plugin Manager
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
       Plugin            Provider           Core
   manifest/engine     3rd-party/API     time/astro/calendar
```

依赖方向：

```text
UI
 ↓
Renderer
 ↓
Plugin
 ↓
Provider
 ↓
Core
```

允许 Renderer 同时读取：

```text
I18n
Terminology
```

禁止：

```text
Core → UI
Calendar Engine → Locale file
Provider → DOM
```

---

# 4. 当前目录

```text
universal-calendar-web-v1.3.0/
│
├─ core/
│  ├─ plugin-contract.js
│  └─ plugin-manager.js
│
├─ state/
│  └─ app-state.js
│
├─ services/
│  └─ api-client.js
│
├─ presentation/
│  ├─ i18n/
│  │  ├─ i18n-core.js
│  │  └─ locales/
│  │     ├─ zh-CN.js
│  │     └─ en.js
│  ├─ terminology/
│  │  └─ terminology-registry.js
│  └─ renderers/
│     └─ renderer-registry.js
│
├─ ui/
│  ├─ formatters.js
│  └─ pages/
│     ├─ interpretation-page.js
│     └─ capabilities-page.js
│
├─ plugins/
│  ├─ plugin-bootstrap.js
│  ├─ bootstrap.js
│  ├─ calendars/
│  │  ├─ gregorian/
│  │  ├─ chinese-modern/
│  │  └─ tibetan/
│  ├─ almanacs/
│  │  ├─ chinese-almanac/
│  │  └─ panchanga/
│  ├─ cosmology/
│  │  ├─ huangji/
│  │  └─ yuga/
│  └─ cycles/
│     ├─ maya/
│     └─ pawukon/
│
├─ calendar-core.js
├─ temporal-core.js
├─ universal-engine.js
├─ calendar-registry.js
├─ civilization-registry.js
├─ advanced-systems.js
├─ earth-map.js
├─ app.js
└─ server.py
```

---

# 5. Plugin Contract

文件：

```text
core/plugin-contract.js
```

职责：

- 校验 manifest；
- 校验 executable plugin；
- 统一默认字段；
- 管理允许的 Plugin Type；
- 管理标准 Representation。

标准 Plugin Type：

```text
calendar
almanac
religion
era
country
history
auspicious
cycle
astrology
cosmology
personal
```

标准 Representation：

```text
year-month-day
continuous-count
concurrent-cycles
composite-cycles
hierarchical-chronology
observation-result
almanac-properties
five-limb-almanac
activity-timing
religious-observances
regional-almanac
ritual-cycle
astral-interpretation
historical-almanac
person-temporal-context
custom
```

未知类型可使用：

```text
custom
```

未来扩展 Representation 建议使用：

```text
x-<name>
```

---

# 6. Plugin Manager

文件：

```text
core/plugin-manager.js
```

当前 API：

```js
PluginManager.register(bundle)
PluginManager.registerLegacy(meta)
PluginManager.syncLegacy()
PluginManager.get(id)
PluginManager.list(filter)
PluginManager.execute(id, input, extra)
PluginManager.render(id, result, opts)
PluginManager.capabilities()
PluginManager.dependencyReport(id)
PluginManager.unregister(id)
```

## 6.1 register

```js
PluginManager.register({
  manifest,
  engine,
  renderer,
  terminology,
  locales
});
```

注册时会：

1. Normalize manifest；
2. 写入新 Plugin Registry；
3. 同步到旧 `UniversalTemporalEngine` metadata registry；
4. terminology 注册到 `TerminologyRegistry`；
5. locales 注册到 `I18n` namespace；
6. custom renderer 注册到 `RendererRegistry`。

---

# 7. Manifest

推荐：

```js
{
  id: 'chinese-almanac',
  type: 'almanac',
  name: '中国传统黄历',
  en: 'Chinese Traditional Almanac',
  civilization: '中华文明',

  status: 'versioned',
  version: '1.3.0',

  representation: 'almanac-properties',
  dependsOn: ['chinese'],

  coverage: '...',

  ruleSet: {
    id: 'lunar-python-1.4',
    name: '6tail lunar-python traditional almanac'
  },

  ui: {
    selectable: true,
    group: 'interpretation',
    renderer: 'chinese-almanac'
  }
}
```

`Full` / `Versioned` 必须对应明确 RuleSet。

---

# 8. Engine Contract

最低可执行插件：

```js
engine: {
  async compute(input, context) {
    return Representation;
  }
}
```

`input` 当前可包含：

```text
jdn
selectedJdn
g            Gregorian locator
location
hour
ruleSet
engine
activity
person
```

不是所有插件都需要全部字段。

`context`：

```js
{
  core: {
    calendar,
    temporal,
    universal
  },
  services: {
    api
  },
  i18n,
  terms,
  renderers,
  pluginManager
}
```

Engine 禁止直接修改 DOM。

---

# 9. Provider

V1.3.0 正式把 Provider 与 Plugin 概念分离。

例如：

```text
Chinese modern calendar Plugin
          ↓
CalendarApiClient
          ↓
sxtwl provider
```

```text
Chinese Almanac Plugin
          ↓
CalendarApiClient
          ↓
lunar-python provider
```

```text
Tibetan Plugin
          ↓
CalendarApiClient
          ↓
caltib provider
```

Provider 可以替换，插件身份不变。

---

# 10. API Service

文件：

```text
services/api-client.js
```

从 `app.js` 抽离：

```text
status
Chinese day/month/almanac/from-lunar
Thai day/month
Tibetan day
geocode
reverse geocode
location resolve
```

并集中维护浏览器内 memory cache。

因此以后页面不应重新写：

```js
fetch('/api/chinese/...')
```

优先：

```js
CalendarApiClient.chineseDay(...)
```

---

# 11. I18n Core

文件：

```text
presentation/i18n/i18n-core.js
```

`i18n` = internationalization。

API：

```js
I18n.registerLocale(locale, dict, options)
I18n.t(key, vars, opts)
I18n.setLocale(locale)
I18n.getLocale()
I18n.applyDocument()
```

当前：

```text
zh-CN
en
```

支持未来 RTL metadata：

```text
ar
he
```

计算结果不得因为 UI Locale 改变。

---

# 12. Plugin Scoped I18n

插件可以：

```js
locales: {
  'zh-CN': {
    title: '中国传统黄历'
  },
  'en': {
    title: 'Chinese Traditional Almanac'
  }
}
```

注册到 namespace：

```text
plugin id
```

因此插件作者无需修改全局语言包。

---

# 13. Terminology Registry

文件：

```text
presentation/terminology/terminology-registry.js
```

用途：

> 保存文明术语本体，不把原始数据与翻译混为一体。

示例：

```js
{
  'field.dayOfficer': {
    native: '建除十二值',
    romanization: {
      en: 'Twelve Day Officers'
    }
  }
}
```

格式化：

```js
TerminologyRegistry.format({
  pluginId: 'chinese-almanac',
  termId: 'field.dayOfficer'
});
```

原则：

```text
Native 是权威值
Romanization 可选
Translation 可选
Explanation 可国际化
```

无可靠译名时保持原文。

---

# 14. Renderer Registry

文件：

```text
presentation/renderers/renderer-registry.js
```

当前 Renderer：

```text
generic-key-value
hierarchical-chronology
cycle-grid
almanac
```

插件可以：

1. 只声明 generic renderer；
2. 提供自己的 renderer function。

Renderer 不负责计算。

---

# 15. App State

文件：

```text
state/app-state.js
```

当前集中管理：

```text
locale
location
selectedJdn
activeView
activeTraditions
activeInterpretationPlugins
engineStatus
```

API：

```js
AppState.get(key)
AppState.set(key, value)
AppState.subscribe(key, fn)
AppState.snapshot()
```

V1.3.0 仍保留部分 `app.js` local variable 作为兼容层，但改变地点、选中日期、语言等时已经同步到 AppState。

下一步应逐页把 local state 替换为 Store getter。

---

# 16. app.js 拆分状态

V1.1.0：约 508 行。

V1.3.0：已经抽出：

```text
API + cache      → services/api-client.js
shared format    → ui/formatters.js
state store      → state/app-state.js
Interpretation   → ui/pages/interpretation-page.js
Capabilities     → ui/pages/capabilities-page.js
Plugin runtime   → core/plugin-manager.js
```

`app.js` 当前仍约 400 行，属于**迁移中 orchestrator**，而不是最终目标。

下一步建议逐页迁移：

```text
ui/pages/today-page.js
ui/pages/earth-page.js
ui/pages/astronomy-page.js
ui/pages/month-page.js
ui/pages/calendars-page.js
ui/pages/civilization-page.js
ui/pages/converter-page.js
ui/pages/architecture-page.js
```

不要为了“行数更少”机械切文件；每个 Page Module 必须只通过 Runtime Context 访问共享能力。

---

# 17. Legacy Adapter

旧文件：

```text
calendar-registry.js
civilization-registry.js
advanced-systems.js
```

暂不删除。

原因：

> V1.3.0 是渐进式 ABI 迁移。

启动流程：

```text
legacy registry register metadata
        ↓
new executable plugins register
        ↓
PluginManager.syncLegacy()
        ↓
未迁移项目变为 metadata-only Plugin record
```

相同 ID 的正式 ABI Plugin 会覆盖 metadata record。

因此不会出现一次升级后大量功能丢失。

---

# 18. 当前已迁移正式 ABI 插件

## Calendar

```text
gregorian
chinese
tibetan
```

## Interpretation

```text
chinese-almanac
indian-panchanga
huangji-jingshi
indian-yuga
maya-ritual
pawukon-cycles
```

这些用于验证不同 Representation。

---

# 19. 未迁移插件

例如：

```text
indian-muhurta
nahua-tonalpohualli
tibetan-almanac
arabic-electional
european-almanac
personal-bazi
```

当前通过 Legacy Adapter 保留。

不要删除；后续逐个增加 engine / renderer / terminology / source / tests。

---

# 20. UI 自动化目标

新插件 metadata 应驱动：

```text
首页右侧选择栏
时间文化页
能力矩阵
插件详情
```

V1.3.0 的“时间文化页”和能力矩阵已经优先读取 Plugin Manager。

其它页面仍有 CalendarRegistry/ObservanceEngine 旧路径，后续继续迁移。

---

# 21. Location

地点仍是 Core Context，而不是 Country Plugin。

```text
search
↓
Nominatim
↓
Leaflet selection
↓
lat/lon
↓
IANA timezone
↓
LocationContext
```

禁止：

```text
timezone = longitude / 15
```

它只能代表近似太阳时。

---

# 22. Full 状态规则

禁止：

```text
Chinese Almanac = Full
```

正确：

```text
Chinese Almanac / RuleSet A = Full or Versioned
```

同理：

```text
Tibetan / Phugpa
Tibetan / Tsurphu
Maya / GMT 584283
```

都必须注明具体版本。

---

# 23. External

External 不是“不完整”。

用于：

```text
Observed Hijri
Government holidays
Religious authority announcements
```

算法候选与现实采用值分开。

---

# 24. 新插件接入流程

1. 判断 Plugin Type；
2. 确定 Representation；
3. 确定 RuleSet；
4. 写来源；
5. 声明 dependsOn；
6. 实现 `engine.compute()`；
7. 选择 generic renderer 或自定义；
8. 提供 native terminology；
9. 可选提供 locale；
10. 写锚点测试；
11. 更新 Sources；
12. 确认能力矩阵自动出现。

---

# 25. 新插件示例

```js
window.PluginBootstrap.define({
  manifest: {
    id: 'new-cycle',
    type: 'cycle',
    name: '原生名称',
    status: 'versioned',
    representation: 'concurrent-cycles',
    dependsOn: ['temporal-core'],
    ruleSet: {
      id: 'source-v1',
      name: 'Source Version 1'
    },
    ui: {
      selectable: true,
      group: 'interpretation',
      renderer: 'cycle-grid'
    }
  },
  engine: {
    compute(input) {
      return {
        type: 'concurrent-cycles',
        cycles: {
          a: 1,
          b: 2
        }
      };
    }
  }
});
```

---

# 26. Codex 禁止事项

Codex 不应：

1. 把 Gregorian 重新设为 Universal Root；
2. 在 `app.js` 里新增完整新插件算法；
3. 在 `advanced-systems.js` 持续堆所有新系统；
4. 新增插件时手工写首页固定 checkbox；
5. 把文明术语翻译字符串作为内部 key；
6. 用 UI locale 改变算法结果；
7. 让 Provider 直接操作 DOM；
8. 无来源发明 RuleSet；
9. 把 Planned 通过简化伪算法改成 Full；
10. 把行政时区等同经度太阳时；
11. 把藏历日期算法等同藏族整个 Almanac；
12. 用 `year % 64` 冒充皇极经世完整卦法。

---

# 27. Codex 修改前检查表

```text
[ ] 这属于哪一层？
[ ] Plugin Type？
[ ] Representation？
[ ] RuleSet？
[ ] Provider？
[ ] Source？
[ ] 是否依赖 Location？
[ ] 是否依赖 Astronomy？
[ ] 是否存在多个版本？
[ ] status 应该是什么？
[ ] Engine 是否纯计算？
[ ] Renderer 是否只显示？
[ ] 术语是否保存 native？
[ ] UI 是否可以从 Registry 自动发现？
[ ] 是否有 anchor test？
```

---

# 28. 测试

运行：

```bash
node tests_core.js
node tests_v02.js
node tests_v10.js
node tests_v101.js
node tests_v110.js
node tests_v120.js
node tests_v121.js
python -m py_compile server.py
```

V1.2 ABI 测试包括：

```text
Plugin Manager boot
Legacy Adapter
Dependency Graph
Calendar Plugin execute
Maya composite cycles
Huangji hierarchy
I18n locale switch
Terminology native preservation
Renderer registry
app.js delegation
```

---

# 29. 下一阶段建议

## P0

```text
继续拆 app.js
将 calendar-registry 正式迁成 Calendar Plugin manifests
建立 Provider Manager
建立 schema validators
```

## P1

```text
Panchanga high-precision provider
Pawukon sourced full RuleSet
Historical Calendar Resolver
Korean/Vietnamese regional variants
Burmese/Khmer/Lao/Sinhala
```

## P2

```text
Country Provider
External Authority Provider
更多 UI locales
RTL 完整界面测试
Mars Planet Provider 独立化
```

---

# 30. 最小交接摘要

```text
Universal Civilization Calendar v1.3.0 已正式建立 Plugin ABI。

Root = Planet + Instant + Location。

五层：
Physical → Astronomical → Calendar → Civilizational → Interpretive。

Presentation 独立：
I18n + Terminology + Renderer。

新插件：
manifest + engine + optional renderer + terminology + locales + sources + tests。

PluginManager.execute() 负责执行。
PluginManager.render() 负责选择 Renderer。
Provider 与 Plugin 分离。
旧 Registry 通过 Legacy Adapter 保持兼容。

不要继续把新算法塞进 app.js / advanced-systems.js。
不要强制翻译区域性术语。
不要无来源伪造 Full RuleSet。
```

---

**End — v1.3.0 handoff**
